const makeGlyphs = require("../api/makeGlyphs");

const colors = require("colors/safe");
const { writeFileSync } = require("fs");

exports.command = "width [dest]";
exports.desc = "extract the width data to a file";

exports.builder = (yargs) => {
  yargs.positional("dest", {
    describe: "filename to save as",
    type: "string",
    default: "mojangles_width_data",
  });
};

exports.handler = async (argv) => {
  console.log(
    colors.yellow(`Using Minecraft version ${colors.bold(argv.mcversion)}`)
  );

  makeGlyphs(argv.mcversion, argv.debug)
    .then(({ finalFont, glyphs }) => {

      // Set the output file name
      const outputFileName = `${argv.dest.toString()}.json`;

      // Create an array to store the data
      let data = [];

      // Iterate through every glyph
      for (g in glyphs) {
        // Get and set the length values
        const { x2, x1 } = glyphs[g].getBoundingBox();
        xMax = x2;
        xMin = x1;
        width = xMax - xMin; // subtract xMin from xMax
        width += 2; // add 2 for padding (fontforge / space between chars)
        // Get and set (if possible) the unicode character and hex values
        let val = "";
        let unicodeHex = "";
        try {
          val = String.fromCodePoint(glyphs[g].unicode);
          unicodeHex = glyphs[g].unicode.toString(16);
        } catch {}


        // Add the \u formatting to the unicode hex character
        var uid = "\\u" + "0000".substring(0, 4 - unicodeHex.length) + unicodeHex;

        // Push the data to the array
        data.push({
          uid,
          id: glyphs[g].unicode,
          val,
          width,
        }); //, x: {xMax, xMin}});
      }

      // Write the file
      writeFileSync(outputFileName, JSON.stringify(data));
      console.log(`Saved to ${outputFileName}!`);
    })
    .catch((err) => {
      console.error(colors.red(err.message));
      return err;
    });
};
