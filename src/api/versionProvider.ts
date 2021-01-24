import { gray } from "colors/safe";
import fetch from "node-fetch";

const URL = "https://launchermeta.mojang.com/mc/game/version_manifest.json";

export const getManifest = async (debug = false) => {
    if (debug) {
        console.log(gray(`Using manifest URL: ${URL}`));
    }
    return await fetch(URL).then((res) => res.json());
};

export const getJar = async (requestedVersion: string, debug = false) => {
    if (debug) console.log(gray(`Requested version: ${requestedVersion}`));

    // Get the manifest
    const manifest = await getManifest(debug);

    // Get the object in the manifest corresponding to the version we are trying to download
    const versionObj = manifest.versions.find(
        (version) => version.id == requestedVersion
    );

    if (!versionObj) {
        throw Error("Version not found!");
    }

    if (debug)
        console.log(gray(`Got version object: ${JSON.stringify(versionObj)}`));

    // Fetch the package URL for that version
    const versionPackage = await fetch(versionObj.url).then((res) =>
        res.json()
    );

    if (debug)
        console.log(
            gray(`Found client.jar URL: ${versionPackage.downloads.client.url}`)
        );

    // Fetch the client.jar
    const jar = await fetch(versionPackage.downloads.client.url).then((res) =>
        res.arrayBuffer()
    );

    if (debug) console.log(gray(`Downloaded client.jar!`));

    return jar;
};
