#!/usr/bin/env node
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";

yargs(hideBin(process.argv))
    // Set the app name in responses
    .scriptName("mc-font-extractor")
    // Use commands from the cli folder
    .commandDir("cli")
    // Show help if command not valid
    .demandCommand()
    // Enable --help and --version
    .help()
    .version()
    // Set --mcversion option
    .option("mcversion", {
        default: "1.16.5",
        type: "string",
        description: "minecraft version to use",
    })
    // Set --debug option
    .option("debug", {
        default: false,
        type: "boolean",
        description: "show debug output",
    })
    .alias("help", "h")
    .alias("version", "v")
    .alias("mcversion", "m").argv;
