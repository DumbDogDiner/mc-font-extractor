import colors from "colors/safe";
import { writeFile } from "fs/promises";

import { extractCharMap } from "../api/extractCharMap";

export const extract = {
    command: "extract [dest]",
    desc: "extract the character map to a file",
    builder: (yargs) => {
        yargs.positional("dest", {
            describe: "filename to save as",
            type: "string",
            default: "providers",
        });
    },
    handler: async (argv) => {
        console.log(
            colors.yellow(
                `Using Minecraft version ${colors.bold(argv.mcversion)}`
            )
        );

        const providers = await extractCharMap(argv.mcversion, argv.debug);
        const outputFileName = `${argv.dest.toString()}.json`;
        await writeFile(
            outputFileName,
            JSON.stringify({ providers: providers })
        );
        console.log(`Saved to ${outputFileName}!`);
    },
};
