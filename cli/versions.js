const { getManifest } = require("../api/versionProvider")

exports.command = "versions";
exports.desc = "list available minecraft versions";

exports.handler = async () => {
    const manifest = await getManifest();

    console.log(manifest.versions.map(v => { return v.id }).join("\n"))
};