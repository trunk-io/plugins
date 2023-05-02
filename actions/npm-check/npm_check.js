#!/usr/bin/env node

// trunk-ignore-all(eslint)
const npmCheck = require("npm-check");
const YAML = require("yaml");
const path = require("path");

const ICON_PATH = "https://avatars.githubusercontent.com/u/6078720";

const pluralize = (count, singular, plural) => {
  return count == 1 ? singular : plural;
};

npmCheck({})
  .then((current) => {
    const uninstalled = current.get("packages").filter((p) => {
      return !p.isInstalled;
    });
    if (uninstalled.length == 0) {
      const yaml = YAML.stringify({ notifications_to_delete: ["npm-check"] });
      console.log(yaml);
      return;
    }
    const uninstalled_count = uninstalled.length;
    const yaml = YAML.stringify({
      notifications: [
        {
          id: "npm-check",
          title: "Check npm packages",
          message: `${uninstalled_count} npm ${pluralize(
            uninstalled_count,
            "package",
            "packages"
          )} ${pluralize(uninstalled_count, "needs", "need")} to be installed`,
          commands: [{ run: "npm install", title: "npm install" }],
          icon: ICON_PATH,
        },
      ],
    });
    console.log(yaml);
  })
  .catch((err) => {
    const yaml = YAML.stringify({
      notifications: [
        {
          id: "npm-check",
          title: "Check npm packages",
          message: `Error: ${err.message}`,
          icon: ICON_PATH,
        },
      ],
    });
    console.log(yaml);
  });
