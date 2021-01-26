
module.exports = class extractGlyphSizes {
  constructor(zip) {
    this.glyphWidth = new ArrayBuffer(65536); // size FFFF
    this.zip = zip;
    this.unicodePageIdsHex = new Array();
    this.unicodePageIdsDecimal = new Array();
    this.unicodePageIds = [];
  }

  _readGlyphSizes = async () => {
    this.glyphWidth = await this.zip
      .file("assets/minecraft/font/glyph_sizes.bin")
      .async("arraybuffer");
    console.log(this.glyphWidth);
  };

  _getUnicodePageLocation = async (pageId) => {
    return this.zip.file(`assets/minecraft/font/unicode_page_${pageId}.png`);
  };

  _iterateThroughAllAvailableUnicodePages = async () => {
    this.zip
      .folder("assets/minecraft/textures/font/")
      .forEach((relativePath, file) => {
        if (relativePath.startsWith("unicode_page_")) {
          const fileHex = relativePath
            .split("unicode_page_")[1]
            .split(".png")[0];
          const file = parseInt(fileHex, 16);

          console.log(`[page_found] ${fileHex} (${file})`);
          this.unicodePageIdsHex.push(fileHex);
          this.unicodePageIdsDecimal.push(file);

          this.unicodePageIds.push({ hex: fileHex, decimal: file });
        }
      });

    console.log("found " + this.unicodePageIds.length + " pages!");

    console.log("sorting...");
    this.unicodePageIds.sort((a, b) => a.decimal - b.decimal);
    console.log(this.unicodePageIds);
  };

  //  _getLengthForFilePrefix = async (prefix_hex) => {
  //    
  //};
    _rofl = () => {
        let output = [];
        for (let i = 0; i < this.unicodePageIds.length; i++) {
            //DEBUG | console.log(`Iteration ${i}`)

            let charsLine = ""
            let chars = []

            let i3 = 1;

            // idk why i need to do 16*16 + 16 but it makes it 16x16 so whatevs 
            for (let i2 = 0; i2 < (255 + 16); i2++) {
                // convert it to hex
                const aHex = i2.toString("16")
                // pad to 4 chars
                const aHexP = aHex.padStart(4, `${this.unicodePageIds[i].hex}00`);
                charsLine += String.raw`\u${aHexP}`
                
                //console.log(chars)
                // newline every 16
                if (i3 == 16) {
                    //console.log("FOUND LINE 16")
                    chars.push(charsLine);
                    //DEBUG | console.log(charsLine);
                    charsLine = "";
                    i3 = 0;
                }

                i3++;
            }

            output.push({
                type: "bitmap",
                file: `minecraft:font/unicode_page_${this.unicodePageIds[i].hex}.png`,
                height: 16,
                //ascent: 7, // bad but hey we need something
                chars
            })
        }

        require("fs").writeFileSync("rofl.json", JSON.stringify(output))
        return output;
    }
};