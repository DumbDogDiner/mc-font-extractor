import { getManifest } from "../api/versionProvider";

export const versions = {
    command: "versions",
    desc: "list available minecraft versions",
    handler: async (argv) => {
        const manifest = await getManifest(argv.debug);

        console.log(
            manifest.versions
                .map((v) => {
                    return v.id;
                })
                .join("\n")
        );
    },
};
