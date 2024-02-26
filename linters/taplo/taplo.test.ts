import path from "path";
import semver from "semver";
import { customLinterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";

// taplo doesn't use semver versioning
// Examples of taplo versions include release-cli-0.6.0, release-taplo-cli-0.7.0, 0.8.0
const versionGreaterThanOrEqual = (a: string, b: string) => {
  const normalizedA = a.replace("release-cli-", "").replace("release-taplo-cli-", "");
  const normalizedB = b.replace("release-cli-", "").replace("release-taplo-cli-", "");
  return semver.gte(normalizedA, normalizedB);
};

const manualVersionReplacer = (version: string) => {
  if (version === "release-taplo-0.13.0") {
    // As of 2/26, taplo-cli-0.9.0 does not provide a release binary.
    // If the binary is released, this version should be updated to 0.9.0.
    // For now, this callback avoids spammy test notifs.
    return "0.8.1";
  }
  return version;
};

// NOTE(Tyler): Currently, taplo doesn't have a fully compatible download for Windows. We hope to enable it in the future.
customLinterCheckTest({
  linterName: "taplo",
  args: `${TEST_DATA} -y`,
  pathsToSnapshot: [path.join(TEST_DATA, "basic.toml")],
  versionGreaterThanOrEqual,
  manualVersionReplacer,
});
