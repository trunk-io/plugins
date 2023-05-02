#!/usr/bin/env node

// trunk-ignore-all(eslint)
const yarnCheck = require("yarn-check");
const YAML = require("yaml");
const path = require("path");

const ICON_PATH = "https://avatars.githubusercontent.com/u/22247014";

const pluralize = (count, singular, plural) => {
  return count == 1 ? singular : plural;
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
          title: "Check yarn packages",
          message: `${uninstalled_count} yarn ${pluralize(
            uninstalled_count,
            "package",
            "packages"
          )} ${pluralize(uninstalled_count, "needs", "need")} to be installed\n`,
          commands: [{ run: "yarn install", title: "yarn install" }],
          icon: ICON_PATH,
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
          title: "Check yarn packages",
          message: `Error: ${err.message}`,
          icon: ICON_PATH,
        },
      ],
    });
    console.log(yaml);
  });
