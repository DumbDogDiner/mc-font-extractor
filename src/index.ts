import { writeFile } from "fs/promises";

import { makeGlyphs } from "./api/makeGlyphs";

(async () => {
    const { finalFont, glyphs } = await makeGlyphs("1.16.5");

    await writeFile("font.otf", Buffer.from(finalFont.toArrayBuffer()));

    let a = [];
    for (let g in glyphs) {
        const { x2, x1 } = glyphs[g].getBoundingBox();
        const xMax = x2;
        const xMin = x1;
        const lenX = xMax - xMin; // subtract xMin from xMax
        let val = "";
        let unicodeHex = "";
        try {
            val = String.fromCodePoint(glyphs[g].unicode);
            unicodeHex = glyphs[g].unicode.toString(16);
        } catch {}

        //var hex = glyphs[g].unicode.toString();
        var result =
            "\\u" + "0000".substring(0, 4 - unicodeHex.length) + unicodeHex;
        a.push({
            uid: result,
            id: glyphs[g].unicode,
            val,
            lenX,
        }); //, x: {xMax, xMin}});
    }

    await writeFile("data.json", JSON.stringify(a));

    await writeFile(
        "data_chars.txt",
        a
            .map((v) => {
                return v.val;
            })
            .join("")
            .toString()
    );

    console.log(JSON.stringify(a.find((f) => f.id == 213)));
})();
