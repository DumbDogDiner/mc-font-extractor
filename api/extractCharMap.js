const console = require("prefix-logger")("mc-font-extractor.extractCharMap");

const { getJar } = require("./versionProvider")
const findCharacterMap = require("./findCharacterMap")

const JSZip = require("jszip");

module.exports = extractCharMap = async (version, debug) => {
  // valid version, continue

  console.log("Downloading jar...");

  //const jar = await fetch(versions[version].url).then((res) =>
  //  res.arrayBuffer()
  //);
  const jar = await getJar(version, debug);

  console.log("Loading jar...");

  const jarZip = new JSZip();

  const zip = await jarZip.loadAsync(jar);

  console.log("Finding character map...")

  const providers = await findCharacterMap(zip);

  console.log("Found character map!")

  return { providers, zip };
};