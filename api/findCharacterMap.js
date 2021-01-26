
// mcjarfontgetter detection routine
module.exports = findCharacterMap = async (zip) => {
  //get char map from default.txt, or from predefined maps if it doesn't exist
  var cp437 = [
      "\u0000\u263a\u263b\u2665\u2666\u2663\u2660\u2022\u25d8\u25cb\u25d9\u2642\u2640\u266a\u266b\u263c",
      "\u25ba\u25c4\u2195\u203c\u00b6\u00a7\u25ac\u21a8\u2191\u2193\u2192\u2190\u221f\u2194\u25b2\u25bc",
      " !\"#$%&'()*+,-./",
      "0123456789:;<=>?",
      "@ABCDEFGHIJKLMNO",
      "PQRSTUVWXYZ[\\]^_",
      "`abcdefghijklmno",
      "pqrstuvwxyz{\u00a6}~\u2302",
      "\u00c7\u00fc\u00e9\u00e2\u00e4\u00e0\u00e5\u00e7\u00ea\u00eb\u00e8\u00ef\u00ee\u00ec\u00c4\u00c5",
      "\u00c9\u00e6\u00c6\u00f4\u00f6\u00f2\u00fb\u00f9\u00ff\u00d6\u00dc\u00a2\u00a3\u00a5\u20a7\u0192",
      "\u00e1\u00ed\u00f3\u00fa\u00f1\u00d1\u00aa\u00ba\u00bf\u2310\u00ac\u00bd\u00bc\u00a1\u00ab\u00bb",
      "\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255d\u255c\u255b\u2510",
      "\u2514\u2534\u252c\u251c\u2500\u253c\u255e\u255f\u255a\u2554\u2569\u2566\u2560\u2550\u256c\u2567",
      "\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256b\u256a\u2518\u250c\u2588\u2584\u258c\u2590\u2580",
      "\u03b1\u03b2\u0393\u03c0\u03a3\u03c3\u00b5\u03c4\u03a6\u0398\u03a9\u03b4\u221e\u2205\u2208\u2229",
      "\u2261\u00b1\u2265\u2264\u2320\u2321\u00f7\u2248\u00b0\u2219\u00b7\u221a\u207f\u00b2\u25a0\u00a0",
    ],
    cp437m = [
      "\u00c0\u00c1\u00c2\u00c8\u00ca\u00cb\u00cd\u00d3\u00d4\u00d5\u00da\u00df\u0101\u014d\u011f\u0130",
      "\u0131\u0152\u0153\u015e\u015f\u0174\u0175\u017e\u00ea",
    ].concat(cp437.slice(2));

  if (zip.file("pack.mcmeta")) {
    //get pack version from pack.mcmeta if it exists
    var version = JSON.parse(await zip.file("pack.mcmeta").async("string")).pack
      .pack_format;
    if (version >= 4) {
      //default.json mapping exists
      if (version > 6) {
        console.log(
          "Future version (1.17+) detected! Continuing with unknown support."
        );
      }
      // jcx start
      const c = require("./extractGlyphSizes");
      const n = new c(zip);
      n._iterateThroughAllAvailableUnicodePages();

      //return JSON.parse(
      //    await zip.file("assets/minecraft/font/default.json").async("string")
      //).providers;
      const stockProviders = JSON.parse(
        await zip.file("assets/minecraft/font/default.json").async("string")
      ).providers;

      //return stockProviders.concat(n._rofl()); // all
      //return [stockProviders[2]] // stock only
      return (n._rofl()); // unicode only
    } else if (version == 1) {
      //pack.mcmeta exists, code page 437
      return [
        {
          type: "bitmap",
          file: "minecraft:font/ascii.png",
          ascent: 7,
          chars: cp437,
        },
      ];
    } else {
      //pack.mcmeta exists, modified cp437
      return [
        {
          type: "bitmap",
          file: "minecraft:font/ascii.png",
          ascent: 7,
          chars: cp437m,
        },
      ];
    }
  } else if (zip.file("assets/minecraft/textures/font/ascii.png")) {
    //pack.mcmeta does not exist, modified cp437
    return [
      {
        type: "bitmap",
        file: "minecraft:font/ascii.png",
        ascent: 7,
        chars: cp437m,
      },
    ];
  } else if (zip.file("font/default.png")) {
    //pack.mcmeta does not exist, cp437
    return [
      {
        type: "bitmap_legacy_tp",
        ascent: 7,
        chars: cp437,
        file: "legacy texture pack",
      },
    ];
  } else {
    //no font detected
    console.warn("Error: No font detected");
  }
};
