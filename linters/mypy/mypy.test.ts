import { customLinterCheckTest } from "tests";

// mypy doesn't use semver versioning, so we need to pass a custom callback.
// Examples of mypy versions include 0.4, 0.4.4, 0.470, 0.991, but only the one-decimal ones are released through pip
const versionGreaterThanOrEqual = (a: string, b: string) => [a.split(".")] >= [b.split(".")];

customLinterCheckTest({
  linterName: "mypy",
  args: "-a",
  versionGreaterThanOrEqual,
});
