// NO
// ...
// this code is so type unsafe that i refuse to touch it ever again
const console = require("prefix-logger")("mc-font-extractor.makeGlyphs");

import { gray } from "colors/safe";
import opentype from "opentype.js";
import UPNG from "upng-js";

import { extractCharMap } from "./extractCharMap";

export const makeGlyphs = async (version: string, debug = false) => {
    const { providers, zip } = await extractCharMap(version, debug);

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

    for (let i = 0; i < providers.length; i++) {
        //i cycles through each provider
        let imagePath: string;
        if (providers[i].type == "bitmap") {
            //set imagePath letiable based on provider type
            imagePath =
                "assets/" + providers[i].file.split(":").join("/textures/");
        } else if (providers[i].type == "bitmap_legacy_tp") {
            imagePath = "font/default.png";
        }

        if (!imagePath) {
            continue;
        }

        console.log("Reading provider " + providers[i].file);
        const image = UPNG.decode(
            await zip.file(imagePath).async("arraybuffer")
        );
        const imageMap = new DataView(UPNG.toRGBA8(image)[0]); //get image using file path
        const ascent = providers[i].ascent;
        const charsPerRow = providers[i].chars[0].replace(
            /[\udc00-\udfff]/g,
            ""
        ).length;
        const charsPerCol = providers[i].chars.length;

        const height = image.height / charsPerCol;
        const width = image.width / charsPerRow;
        //new scaling support code
        const heightScale = height / (providers[i].height || 8);

        const divisors = [
            Math.max(commonMultiple, heightScale),
            Math.min(commonMultiple, heightScale),
        ];

        while (divisors[1] > 0) {
            divisors.push(divisors[0] % divisors[1]);
            divisors.shift();
        }

        const GCF = (commonMultiple * heightScale) / divisors[0]; //GCF is now new common multiple
        if (commonMultiple != GCF) {
            for (let j in glyphs) {
                glyphs[j].advanceWidth *= GCF / commonMultiple;
                for (let k = 0; k < glyphs[j].path.commands.length; k++) {
                    glyphs[j].path.commands[k].x *= GCF / commonMultiple;
                    glyphs[j].path.commands[k].y *= GCF / commonMultiple;
                }
            } //scale each glyph to new size
            console.log("Scaling glyphs by " + GCF / commonMultiple);
            commonMultiple = GCF;
        }

        const providerScale = commonMultiple / heightScale;

        for (let j = 0; j < charsPerRow * charsPerCol; j++) {
            //j cycles through each character
            const currentRow = providers[i].chars[Math.floor(j / charsPerRow)];
            for (let k = 0, l = 0; k < j % charsPerRow; k++) {
                if (currentRow.codePointAt(k + l) > 0xffff) l++;
            } //finds jth code point, not jth word
            const currentCodePoint = currentRow.codePointAt(k + l) || 0; //sets current code point
            if (!glyphs[currentCodePoint]) {
                //only add char if not already defined
                totalGlyphCount++;
                let glyphPath = new opentype.Path();
                let l = []; //l will keep track of the rightmost pixel of the char
                let topLeftPixel =
                    (j % charsPerRow) * width +
                    Math.floor(j / charsPerRow) * image.width * height;
                for (let k = 0; k < height * width; k++) {
                    //k cycles through the pixels in the char
                    let currentPixel =
                        Math.floor(k / width) * image.width +
                        (k % width) +
                        topLeftPixel; //set currentpixel to pixel in image
                    l[k % width] =
                        (l[k % width] || 0) +
                        imageMap.getUint8(currentPixel * 4 + 3); //add alpha value to current column in l
                    if (imageMap.getUint8(currentPixel * 4 + 3) > 127) {
                        //if pixel is visible enough to be in font
                        //convert k to ttf coordinate system
                        let ttfy =
                                (ascent * (commonMultiple / providerScale) -
                                    Math.floor(k / width)) *
                                amplifier *
                                providerScale,
                            ttfx =
                                (k % width) * amplifier * providerScale +
                                !!centerA * (amplifier / 2) * providerScale;
                        let leftLine = glyphPath.commands.findIndex(
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
                                leftLine +
                                    (glyphPath.commands[leftLine].y != ttfy),
                                1 + (glyphPath.commands[leftLine].y == ttfy),
                                ...[
                                    { type: "L", x: ttfx, y: ttfy },
                                    {
                                        type: "L",
                                        x: ttfx + amplifier * providerScale,
                                        y: ttfy,
                                    },
                                    {
                                        type: "L",
                                        x: ttfx + amplifier * providerScale,
                                        y: ttfy - amplifier * providerScale,
                                    },
                                ].slice(glyphPath.commands[leftLine].y == ttfy)
                            );
                            //check if line on top
                            let topLine = glyphPath.commands.findIndex(
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
                                    let leftClumpStart = leftLine;
                                    leftClumpStart > -1;
                                    leftClumpStart--
                                )
                                    if (
                                        glyphPath.commands[leftClumpStart]
                                            .type == "M"
                                    )
                                        break;
                                for (
                                    let leftClumpEnd = leftLine;
                                    leftClumpEnd < glyphPath.commands.length;
                                    leftClumpEnd++
                                )
                                    if (
                                        glyphPath.commands[leftClumpEnd].type ==
                                        "Z"
                                    )
                                        break;
                                if (
                                    topLine > leftClumpStart &&
                                    topLine < leftClumpEnd
                                ) {
                                    //forms a loop
                                    //if (topLine<leftLine) { //path start is outside the loop
                                    let absorb = glyphPath.commands.splice(
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
                                        let absorb = [
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
                                            let topClumpStart = topLine;
                                            topClumpStart > -1;
                                            topClumpStart--
                                        )
                                            if (
                                                glyphPath.commands[
                                                    topClumpStart
                                                ].type == "M"
                                            )
                                                break;
                                        for (
                                            let topClumpEnd = topLine;
                                            topClumpEnd <
                                            glyphPath.commands.length;
                                            topClumpEnd++
                                        )
                                            if (
                                                glyphPath.commands[topClumpEnd]
                                                    .type == "Z"
                                            )
                                                break;
                                        let absorb = [
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
                                            leftLine +
                                            absorb[0].length +
                                            absorb[1].length -
                                            1;
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
                            let topLine = glyphPath.commands.findIndex(
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
                                            ttfx + amplifier * providerScale),
                                    (glyphPath.commands[topLine].x ==
                                        ttfx + amplifier * providerScale) +
                                        (glyphPath.commands[topLine + 1].x ==
                                            ttfx),
                                    ...[
                                        {
                                            type: "L",
                                            x: ttfx + amplifier * providerScale,
                                            y: ttfy,
                                        },
                                        {
                                            type: "L",
                                            x: ttfx + amplifier * providerScale,
                                            y: ttfy - amplifier * providerScale,
                                        },
                                        {
                                            type: "L",
                                            x: ttfx,
                                            y: ttfy - amplifier * providerScale,
                                        },
                                        { type: "L", x: ttfx, y: ttfy },
                                    ].slice(
                                        glyphPath.commands[topLine].x ==
                                            ttfx + amplifier * providerScale,
                                        3 +
                                            (glyphPath.commands[topLine + 1]
                                                .x !=
                                                ttfx)
                                    )
                                );
                            } else {
                                //create the new square
                                glyphPath.commands.push(
                                    { type: "M", x: ttfx, y: ttfy },
                                    {
                                        type: "L",
                                        x: ttfx + amplifier * providerScale,
                                        y: ttfy,
                                    },
                                    {
                                        type: "L",
                                        x: ttfx + amplifier * providerScale,
                                        y: ttfy - amplifier * providerScale,
                                    },
                                    {
                                        type: "L",
                                        x: ttfx,
                                        y: ttfy - amplifier * providerScale,
                                    },
                                    { type: "Z" }
                                );
                            }
                        }
                    }
                }
                //find rightmost pixel and create glyph (make exception for blank glyphs)
                let k = l.length - 1;
                while (l[k] == 0 && k > -1) k--; //k is set to rightmost column with pixels
                let l = currentCodePoint.toString(16);
                while (l.length < 4) l = "0" + l; //prepare unicode code for current code point
                glyphs[currentCodePoint] = new opentype.Glyph({
                    name: "uni" + l,
                    unicode: currentCodePoint,
                    advanceWidth:
                        (k == -1
                            ? 4 * commonMultiple
                            : (k + 2) * providerScale) * amplifier, //width is set to 4 if character is empty
                    path: glyphPath,
                });
                //console.log("Added glyph "+String.fromCodePoint(currentCodePoint))
            } else {
                if (debug)
                    console.log(
                        gray(
                            `Skipped duplicate glyph (${currentCodePoint}): ${String.fromCodePoint(
                                currentCodePoint
                            )}`
                        )
                    );
            }
        }
    }
    //turn glyphs object into an array
    let finalGlyphArray = [];
    for (j in glyphs) {
        finalGlyphArray.push(glyphs[j]);
    }
    //create final font
    let finalFont = new opentype.Font({
        familyName: "Mojangles" + (!centerA ? " left-aligned" : ""),
        styleName: version, // use full version as style name
        unitsPerEm: 9 * commonMultiple * amplifier,
        ascender: 8 * commonMultiple * amplifier,
        descender: -1 * commonMultiple * amplifier,
        glyphs: finalGlyphArray, //temp test of only null and "
    });
    console.log(`Found ${totalGlyphCount} glyphs!`);

    return { finalFont, glyphs };
};
