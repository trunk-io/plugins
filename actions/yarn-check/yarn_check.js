#!/usr/bin/env node

// trunk-ignore-all(eslint)
const yarnCheck = require("yarn-check");
const YAML = require("yaml");
const path = require("path");

const iconPath = path.join(__dirname, "npm.png");

const pluralize = (count, singular, plural) => {
  return count === 1 ? singular : plural;
};

yarnCheck({})
  .then((current) => {
    const uninstalled = current.get("packages").filter((p) => !p.isInstalled);
    if (uninstalled.length == 0) {
      const yaml = YAML.stringify({ notifications_to_delete: ["yarn-check"] });
      console.log(yaml);
      return;
    }
    const uninstalled_count = uninstalled.length;
    const yaml = YAML.stringify({
      notifications: [
        {
          id: "yarn-check",
          title: "Yarn Check",
          message: `${uninstalled_count} yarn ${pluralize(
            uninstalled_count,
            "package",
            "packages"
          )} ${pluralize(uninstalled_count, "needs", "need")} to be installed\n`,
          commands: [{ run: "yarn install", title: "yarn install" }],
          icon: iconPath,
        },
      ],
    });
    console.log(yaml);
    return;
  })
  .catch((err) => {
    const yaml = YAML.stringify({
      notifications: [
        {
          id: "yarn-check",
          title: "Yarn Check",
          message: `Error: ${err.message}`,
          icon: iconPath,
        },
      ],
    });
    console.log(yaml);
  });
