#!/usr/bin/env node

// trunk-ignore-all(eslint)
const npmCheck = require("npm-check");
const YAML = require("yaml");
const path = require("path");

const iconPath = path.join(__dirname, "npm.png");

const pluralize = (count, singular, plural) => {
  return count === 1 ? singular : plural;
};

npmCheck({})
  .then((current) => {
    const uninstalled = current.get("packages").filter((p) => {
      return !p.isInstalled;
    });
    if (uninstalled.length == 0) {
      return;
    }
    const uninstalled_count = uninstalled.length;
    const message = `${uninstalled_count} npm ${pluralize(
      uninstalled_count,
      "package",
      "packages"
    )} ${pluralize(
      uninstalled_count,
      "needs",
      "need"
    )} to be installed to run tests. Run 'npm install' to fix this.\n`;
    console.log(message);
    process.exit(1);
  })
  .catch((err) => {
    const message = `Error in your package.json: ${err.message}`;
    console.log(message);
    process.exit(1);
  });
