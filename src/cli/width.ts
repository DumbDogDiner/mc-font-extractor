import colors from "colors/safe";
import { writeFileSync } from "fs";

import { makeGlyphs } from "../api/makeGlyphs";

export const width = {
    command: "width [dest]",
    desc: "extract the width data to a file",
    builder: (yargs) => {
        yargs.positional("dest", {
            describe: "filename to save as",
            type: "string",
            default: "mojangles_width_data",
        });
    },
    handler: async (argv: {
        dest: string;
        mcversion: string;
        debug: boolean;
    }) => {
        console.log(
            colors.yellow(
                `Using Minecraft version ${colors.bold(argv.mcversion)}`
            )
        );

        const { glyphs } = await makeGlyphs(argv.mcversion, argv.debug);

        // Set the output file name
        const outputFileName = `${argv.dest}.json`;

        // Create an array to store the data
        const data = [];

        // Iterate through every glyph
        for (const g in glyphs) {
            // Get and set the length values
            const { x2, x1 } = glyphs[g].getBoundingBox();
            const xMax = x2;
            const xMin = x1;
            // subtract xMin from xMax
            // add 2 for padding (fontforge / space between chars)
            // Get and set (if possible) the unicode character and hex values
            const width = xMax - xMin + 2;

            let val = "";
            let unicodeHex = "";

            try {
                val = String.fromCodePoint(glyphs[g].unicode);
                unicodeHex = glyphs[g].unicode.toString(16);
            } catch {}

            // Add the \u formatting to the unicode hex character
            var uid =
                "\\u" + "0000".substring(0, 4 - unicodeHex.length) + unicodeHex;

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
    },
};
