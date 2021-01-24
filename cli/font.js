const makeGlyphs = require("../api/makeGlyphs");

const colors = require("colors/safe");
const { writeFileSync } = require("fs");

exports.command = "font [dest]";
exports.desc = "extract the font to a file";

exports.builder = (yargs) => {
  yargs.positional("dest", {
    describe: "filename to save as",
    type: "string",
    default: "Mojangles",
  });
};

exports.handler = async (argv) => {
  console.log(
    colors.yellow(`Using Minecraft version ${colors.bold(argv.mcversion)}`)
  );

  makeGlyphs(argv.mcversion)
    .then(({ finalFont }) => {
      const outputFileName = `${argv.dest.toString()}.otf`;
      writeFileSync(outputFileName, Buffer.from(finalFont.toArrayBuffer()));
      console.log(`Saved to ${outputFileName}!`);
    })
    .catch((err) => {
      console.error(colors.red(err.message));
      return err;
    });
};
