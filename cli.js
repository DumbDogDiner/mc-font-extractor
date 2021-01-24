#!/usr/bin/env node

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

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
  // Set --debug option
  .option("mcversion", {
    default: "1.16.5",
    type: "string",
    description: "minecraft version to use",
  })
  .alias("help", "h")
  .alias("version", "v")
  .alias("mcversion", "m").argv;
