import path from "path";
import semver from "semver";
import { customLinterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";

// taplo doesn't use semver versioning
// Examples of taplo versions include release-cli-0.6.0, release-taplo-cli-0.7.0, 0.8.0
const versionGreaterThan = (a: string, b: string) => {
  const normalizedA = a.replace("release-cli-", "").replace("release-taplo-cli-", "");
  const normalizedB = b.replace("release-cli-", "").replace("release-taplo-cli-", "");
  return semver.gt(normalizedA, normalizedB);
};

customLinterCheckTest({
  linterName: "taplo",
  args: "-a -y",
  pathsToSnapshot: [path.join(TEST_DATA, "basic.toml")],
  versionGreaterThan,
});
