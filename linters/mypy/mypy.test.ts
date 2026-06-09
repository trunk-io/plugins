import { customLinterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";

// mypy doesn't use semver versioning, so we need to pass a custom callback.
// Examples of mypy versions include 0.4, 0.4.4, 0.470, 0.991, but only the one-decimal ones are released through pip
const versionGreaterThanOrEqual = (a: string, b: string) => [a.split(".")] >= [b.split(".")];
const manualVersionReplacer = (version: string) => {
  const [major, minor] = version.split(".").map((part) => Number.parseInt(part, 10));
  if (!Number.isNaN(major) && !Number.isNaN(minor) && major === 1 && minor >= 20) {
    return "1.20.2";
  }
  return version;
};

customLinterCheckTest({
  linterName: "mypy",
  args: TEST_DATA,
  versionGreaterThanOrEqual,
  manualVersionReplacer,
});
