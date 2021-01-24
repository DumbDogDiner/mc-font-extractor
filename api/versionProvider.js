const console = require("prefix-logger")("mc-font-extractor.versionProvider");

const { gray } = require("colors/safe");
const fetch = require("node-fetch");


const getManifest = async (debug) => {
    const url = "https://launchermeta.mojang.com/mc/game/version_manifest.json";

    if (debug) console.log(gray(`Using manifest URL: ${url}`));

    const manifest = await fetch(url).then(res => res.json());
    
    return manifest;
};

const getJar = async (requestedVersion, debug) => {

    if (debug) console.log(gray(`Requested version: ${requestedVersion}`))

    // Get the manifest
    const manifest = await getManifest(debug);

    // Get the object in the manifest corresponding to the version we are trying to download
    const versionObj = manifest.versions.find(version => version.id == requestedVersion);

    if (versionObj == undefined) {
        throw Error("Version not found!");
    }

    if (debug) console.log(gray(`Got version object: ${JSON.stringify(versionObj)}`))

    // Fetch the package URL for that version
    const version_package = await fetch(versionObj.url).then(res => res.json());

    // Get the URL for this version's client.jar
    const version_client_jar_url = version_package.downloads.client.url;

    
    if (debug) console.log(gray(`Found client.jar URL: ${version_client_jar_url}`));

    // Fetch the client.jar
    const jar = await fetch(version_client_jar_url).then((res) => res.arrayBuffer());

    if (debug) console.log(gray(`Downloaded client.jar!`))

    return jar;

}

module.exports = {
    getManifest,
    getJar
}