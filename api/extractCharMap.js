const console = require("prefix-logger")("mc-font-extractor.extractCharMap");

const fetch = require("node-fetch");
const JSZip = require("jszip");

const versions = require("../versions.json");

module.exports = extractCharMap = async (version) => {
  if (!Object.keys(versions).includes(version)) {
    console.error("invalid version");
    return null;
  }

  // valid version, continue

  console.log("downloading jar...");

  const jar = await fetch(versions[version].url).then((res) =>
    res.arrayBuffer()
  );

  console.log("loading jar...");

  const jarZip = new JSZip();

  const zip = await jarZip.loadAsync(jar);

  if (versions[version].pack_version >= 4) {
    console.log("using pack version 4/5/6");

    const providers = JSON.parse(
      await zip.file("assets/minecraft/font/default.json").async("string")
    ).providers;

    return { providers, zip };
  }
};