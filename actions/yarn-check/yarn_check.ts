#!/usr/bin/env node

console.log("Running npm check...");

const { execSync } = require("child_process");

const yarnCheck = require("yarn-check");

npmCheck({}).then((current) => {
  console.log("npm check complete");
  const uninstalled = current.get("packages").filter((p) => !p.isInstalled);
  console.log("uninstalled packages: " + uninstalled.length);
});
