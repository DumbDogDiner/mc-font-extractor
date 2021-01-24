const console = require("prefix-logger")("mc-font-extractor.makeGlyphs");

const opentype = require("opentype.js");
const UPNG = require("upng-js");

const extractCharMap = require("./extractCharMap")

module.exports = makeGlyphs = async (version) => {
  const { providers, zip } = await extractCharMap(version);

  // set the amplifier
  const amplifier = 2;

  // Set the centerA checkbox
  // true: center-align
  // false: left-align
  const centerA = true;

  let commonMultiple = 1;
  // create a glyphs object with only the null glyph
  let glyphs = {
    0: new opentype.Glyph({
      name: ".notdef",
      unicode: 0,
      advanceWidth: 4 * amplifier,
      path: new opentype.Path(),
    }),
  };

  let totalGlyphCount = 0;

  for (var i = 0; i < providers.length; i++) {
    //i cycles through each provider
    var imagepath = undefined;
    if (providers[i].type == "bitmap") {
      //set imagepath variable based on provider type
      imagepath = "assets/" + providers[i].file.split(":").join("/textures/");
    } else if (providers[i].type == "bitmap_legacy_tp") {
      imagepath = "font/default.png";
    }
    if (imagepath) {
      console.log("Reading provider " + providers[i].file);
      var image = UPNG.decode(await zip.file(imagepath).async("arraybuffer"));
      var imagemap = new DataView(UPNG.toRGBA8(image)[0]); //get image using file path
      var ascent = providers[i].ascent;
      var charsPerRow = providers[i].chars[0].replace(/[\udc00-\udfff]/g, "")
        .length;
      var charsPerCol = providers[i].chars.length;
      var height = image.height / charsPerCol;
      var width = image.width / charsPerRow;
      //new scaling support code
      var heightScale = height / (providers[i].height || 8);
      var GCF = [
        Math.max(commonMultiple, heightScale),
        Math.min(commonMultiple, heightScale),
      ];
      while (GCF[1] > 0) {
        GCF.push(GCF[0] % GCF[1]);
        GCF.shift();
      }
      GCF = (commonMultiple * heightScale) / GCF[0]; //GCF is now new common multiple
      if (commonMultiple != GCF) {
        for (var j in glyphs) {
          glyphs[j].advanceWidth *= GCF / commonMultiple;
          for (var k = 0; k < glyphs[j].path.commands.length; k++) {
            glyphs[j].path.commands[k].x *= GCF / commonMultiple;
            glyphs[j].path.commands[k].y *= GCF / commonMultiple;
          }
        } //scale each glyph to new size
        console.log("Scaling glyphs by " + GCF / commonMultiple);
        commonMultiple = GCF;
      }
      var providerscale = commonMultiple / heightScale;
      for (var j = 0; j < charsPerRow * charsPerCol; j++) {
        //j cycles through each character
        var currentRow = providers[i].chars[Math.floor(j / charsPerRow)];
        for (var k = 0, l = 0; k < j % charsPerRow; k++) {
          if (currentRow.codePointAt(k + l) > 0xffff) l++;
        } //finds jth code point, not jth word
        var currentcodepoint = currentRow.codePointAt(k + l) || 0; //sets current code point
        if (!glyphs[currentcodepoint]) {
          //only add char if not already defined
          totalGlyphCount++;
          var glyphPath = new opentype.Path();
          var l = []; //l will keep track of the rightmost pixel of the char
          var topLeftPixel =
            (j % charsPerRow) * width +
            Math.floor(j / charsPerRow) * image.width * height;
          for (var k = 0; k < height * width; k++) {
            //k cycles through the pixels in the char
            var currentpixel =
              Math.floor(k / width) * image.width + (k % width) + topLeftPixel; //set currentpixel to pixel in image
            l[k % width] =
              (l[k % width] || 0) + imagemap.getUint8(currentpixel * 4 + 3); //add alpha value to current column in l
            if (imagemap.getUint8(currentpixel * 4 + 3) > 127) {
              //if pixel is visible enough to be in font
              //convert k to ttf coordinate system
              var ttfy =
                  (ascent * (commonMultiple / providerscale) -
                    Math.floor(k / width)) *
                  amplifier *
                  providerscale,
                ttfx =
                  (k % width) * amplifier * providerscale +
                  !!centerA * (amplifier / 2) * providerscale;
              var leftLine = glyphPath.commands.findIndex(
                (ele, ind, arr) =>
                  ind + 1 < arr.length &&
                  ele.x == ttfx &&
                  ele.y >= ttfy &&
                  arr[ind + 1].x == ttfx &&
                  arr[ind + 1].y < ttfy
              ); //check if a line is on the left
              if (leftLine > -1) {
                //attach left line
                glyphPath.commands.splice(
                  leftLine + (glyphPath.commands[leftLine].y != ttfy),
                  1 + (glyphPath.commands[leftLine].y == ttfy),
                  ...[
                    { type: "L", x: ttfx, y: ttfy },
                    { type: "L", x: ttfx + amplifier * providerscale, y: ttfy },
                    {
                      type: "L",
                      x: ttfx + amplifier * providerscale,
                      y: ttfy - amplifier * providerscale,
                    },
                  ].slice(glyphPath.commands[leftLine].y == ttfy)
                );
                //check if line on top
                var topLine = glyphPath.commands.findIndex(
                  (ele, ind, arr) =>
                    ind + 1 < arr.length &&
                    ele.y == ttfy &&
                    ele.x > ttfx &&
                    arr[ind + 1].y == ttfy &&
                    arr[ind + 1].x <= ttfx
                );
                if (topLine > -1) {
                  //this is the tricky bit
                  for (
                    var leftClumpStart = leftLine;
                    leftClumpStart > -1;
                    leftClumpStart--
                  )
                    if (glyphPath.commands[leftClumpStart].type == "M") break;
                  for (
                    var leftClumpEnd = leftLine;
                    leftClumpEnd < glyphPath.commands.length;
                    leftClumpEnd++
                  )
                    if (glyphPath.commands[leftClumpEnd].type == "Z") break;
                  if (topLine > leftClumpStart && topLine < leftClumpEnd) {
                    //forms a loop
                    //if (topLine<leftLine) { //path start is outside the loop
                    var absorb = glyphPath.commands.splice(
                      topLine + 1,
                      leftLine - topLine - 1
                    );
                    absorb[0].type = "M";
                    absorb.push({ type: "Z" });
                    glyphPath.commands.unshift(...absorb);
                    topLine += absorb.length;
                  } else {
                    //no loop
                    if (topLine < leftClumpEnd) {
                      //top clump is earlier
                      var absorb = [
                        glyphPath.commands.splice(
                          leftLine,
                          1 + leftClumpEnd - leftLine
                        ),
                        glyphPath.commands.splice(
                          leftClumpStart,
                          leftLine - leftClumpStart
                        ),
                      ];
                      absorb[0].pop();
                      absorb[1][0].type = "L";
                      glyphPath.commands.splice(
                        topLine + 1,
                        0,
                        ...absorb[0].concat(absorb[1])
                      );
                    } else {
                      //left clump is earlier; merge top clump into left
                      for (
                        var topClumpStart = topLine;
                        topClumpStart > -1;
                        topClumpStart--
                      )
                        if (glyphPath.commands[topClumpStart].type == "M")
                          break;
                      for (
                        var topClumpEnd = topLine;
                        topClumpEnd < glyphPath.commands.length;
                        topClumpEnd++
                      )
                        if (glyphPath.commands[topClumpEnd].type == "Z") break;
                      var absorb = [
                        glyphPath.commands.splice(
                          topLine + 1,
                          topClumpEnd - topLine
                        ),
                        glyphPath.commands.splice(
                          topClumpStart,
                          1 + topLine - topClumpStart
                        ),
                      ];
                      absorb[0].pop();
                      absorb[1][0].type = "L";
                      glyphPath.commands.splice(
                        leftLine,
                        0,
                        ...absorb[0].concat(absorb[1])
                      );
                      topLine =
                        leftLine + absorb[0].length + absorb[1].length - 1;
                    }
                  }
                  if (
                    glyphPath.commands[topLine].x ==
                    glyphPath.commands[topLine + 1].x
                  )
                    glyphPath.commands.splice(topLine, 2);
                } else if (
                  glyphPath.commands[leftLine].x ==
                  glyphPath.commands[leftLine - 1].x
                )
                  glyphPath.commands.splice(leftLine - 1, 2);
              } else {
                //check if line on top
                var topLine = glyphPath.commands.findIndex(
                  (ele, ind, arr) =>
                    ind + 1 < arr.length &&
                    ele.y == ttfy &&
                    ele.x > ttfx &&
                    arr[ind + 1].y == ttfy &&
                    arr[ind + 1].x <= ttfx
                );
                if (topLine > -1) {
                  glyphPath.commands.splice(
                    topLine +
                      (glyphPath.commands[topLine].x !=
                        ttfx + amplifier * providerscale),
                    (glyphPath.commands[topLine].x ==
                      ttfx + amplifier * providerscale) +
                      (glyphPath.commands[topLine + 1].x == ttfx),
                    ...[
                      {
                        type: "L",
                        x: ttfx + amplifier * providerscale,
                        y: ttfy,
                      },
                      {
                        type: "L",
                        x: ttfx + amplifier * providerscale,
                        y: ttfy - amplifier * providerscale,
                      },
                      {
                        type: "L",
                        x: ttfx,
                        y: ttfy - amplifier * providerscale,
                      },
                      { type: "L", x: ttfx, y: ttfy },
                    ].slice(
                      glyphPath.commands[topLine].x ==
                        ttfx + amplifier * providerscale,
                      3 + (glyphPath.commands[topLine + 1].x != ttfx)
                    )
                  );
                } else {
                  //create the new square
                  glyphPath.commands.push(
                    { type: "M", x: ttfx, y: ttfy },
                    { type: "L", x: ttfx + amplifier * providerscale, y: ttfy },
                    {
                      type: "L",
                      x: ttfx + amplifier * providerscale,
                      y: ttfy - amplifier * providerscale,
                    },
                    { type: "L", x: ttfx, y: ttfy - amplifier * providerscale },
                    { type: "Z" }
                  );
                }
              }
            }
          }
          //find rightmost pixel and create glyph (make exception for blank glyphs)
          var k = l.length - 1;
          while (l[k] == 0 && k > -1) k--; //k is set to rightmost column with pixels
          var l = currentcodepoint.toString(16);
          while (l.length < 4) l = "0" + l; //prepare unicode code for current code point
          glyphs[currentcodepoint] = new opentype.Glyph({
            name: "uni" + l,
            unicode: currentcodepoint,
            advanceWidth:
              (k == -1 ? 4 * commonMultiple : (k + 2) * providerscale) *
              amplifier, //width is set to 4 if character is empty
            path: glyphPath,
          });
          //console.log("Added glyph "+String.fromCodePoint(currentcodepoint))
        } else {
          console.log(`Skipped duplicate glyph (${currentcodepoint}): ${String.fromCodePoint(currentcodepoint)}`,
          );
        }
      }
    } else {
      console.log("Skipping provider " + providers[i].type);
    }
  }
  //turn glyphs object into an array
  var finalGlyphArray = [];
  for (j in glyphs) {
    finalGlyphArray.push(glyphs[j]);
  }
  //create final font
  var finalFont = new opentype.Font({
    familyName: "Mojangles" + (!centerA ? " left-aligned" : ""),
    //styleName: blob.name.split(".").slice(0, -1).join("."),
    styleName: "1.16.5".split(".").slice(0, -1).join("."),
    unitsPerEm: 9 * commonMultiple * amplifier,
    ascender: 8 * commonMultiple * amplifier,
    descender: -1 * commonMultiple * amplifier,
    glyphs: finalGlyphArray, //temp test of only null and "
  });
  console.log(`Found ${totalGlyphCount} glyphs!`);

    return { finalFont, glyphs };
};
