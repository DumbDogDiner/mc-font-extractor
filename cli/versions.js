const { getManifest } = require("../api/versionProvider")

exports.command = "versions";
exports.desc = "list available minecraft versions";

exports.handler = async (argv) => {
    const manifest = await getManifest(argv.debug);

    console.log(manifest.versions.map(v => { return v.id }).join("\n"))
};