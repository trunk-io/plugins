import semver from "semver";
import { customLinterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";

const versionGreaterThanOrEqual = (a: string, b: string) => {
  const normalizedA = a.replace("pmd_releases/", "");
  const normalizedB = b.replace("pmd_releases/", "");
  return semver.gte(normalizedA, normalizedB);
};

customLinterCheckTest({
  linterName: "pmd",
  args: TEST_DATA,
  versionGreaterThanOrEqual,
});
