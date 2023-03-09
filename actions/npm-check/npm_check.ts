#!/usr/bin/env node

console.log("Running npm check...");

const { execSync } = require("child_process");

console.log("Argv length: ", process.argv.length);
console.log("Argv: ", process.argv);
console.log(process.cwd());

const npmCheck = require("npm-check");

npmCheck({}).then((current) => {
  console.log("npm check complete");
  const uninstalled = current.get("packages").filter((p) => !p.isInstalled);
  console.log("uninstalled packages: " + uninstalled.length);
});
