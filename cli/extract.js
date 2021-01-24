const extractCharMap = require("../api/extractCharMap");

const colors = require("colors/safe");
const fs = require("fs");

exports.command = "extract [dest]";
exports.desc = "extract the character map to a file";

exports.builder = (yargs) => {
  yargs.positional("dest", {
    describe: "filename to save as",
    type: "string",
    default: "providers",
  });
};

exports.handler = async (argv) => {
  console.log(
    colors.yellow(`Using Minecraft version ${colors.bold(argv.mcversion)}`)
  );

  extractCharMap(argv.mcversion)
    .then((providers) => {
      const outputFileName = `${argv.dest.toString()}.json`;
      fs.writeFileSync(
        outputFileName,
        JSON.stringify({ providers: providers })
      );
      console.log(`Saved to ${outputFileName}!`);
    })
    .catch((err) => {
      console.error(colors.red(err.message));
      return err;
    });
};
