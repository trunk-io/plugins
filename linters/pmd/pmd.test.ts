import semver from "semver";
import { linterCheckTest } from "tests";

const compareVersion = (a: string, b: string) => {
  const a_stripped = a.replace("pmd_releases/", "");
  const b_stripped = b.replace("pmd_releases/", "");
  return semver.gte(a_stripped, b_stripped);
};

linterCheckTest({
  linterName: "pmd",
  versionGreaterThanOrEqual: compareVersion,
});
