import path from "path";
import semver from "semver";
import { customLinterCheckTest } from "tests";
import { skipOS, TEST_DATA } from "tests/utils";

// taplo doesn't use semver versioning
// Examples of taplo versions include release-cli-0.6.0, release-taplo-cli-0.7.0, 0.8.0
const versionGreaterThanOrEqual = (a: string, b: string) => {
  const normalizedA = a.replace("release-cli-", "").replace("release-taplo-cli-", "");
  const normalizedB = b.replace("release-cli-", "").replace("release-taplo-cli-", "");
  return semver.gte(normalizedA, normalizedB);
};

// NOTE(Tyler): Currently, taplo doesn't have a fully compatible download for Windows. We hope to enable it in the future.
customLinterCheckTest({
  linterName: "taplo",
  args: "-a -y",
  pathsToSnapshot: [path.join(TEST_DATA, "basic.toml")],
  versionGreaterThanOrEqual,
  skipTestIf: skipOS(["win32"]),
});
