import colors from "colors/safe";
import { writeFile } from "fs/promises";

import { makeGlyphs } from "../api/makeGlyphs";

export const font = {
    command: "font [dest]",
    desc: "extract the font to a file",

    builder: (yargs) => {
        yargs.positional("dest", {
            describe: "filename to save as",
            type: "string",
            default: "Mojangles",
        });
    },
    handler: async (argv) => {
        console.log(
            colors.yellow(
                `Using Minecraft version ${colors.bold(argv.mcversion)}`
            )
        );

        const { finalFont } = await makeGlyphs(argv.mcversion, argv.debug);
        const outputFileName = `${argv.dest}.otf`;
        writeFile(outputFileName, Buffer.from(finalFont.toArrayBuffer()));
        console.log(`Saved to ${outputFileName}!`);
    },
};
