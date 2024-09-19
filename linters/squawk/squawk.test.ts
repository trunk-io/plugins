import { linterCheckTest } from "tests";

// No release for squawk on arm64 darwin https://github.com/sbdchd/squawk/issues/372
linterCheckTest({
  linterName: "squawk",
  skipTestIf: () => process.arch === "arm64" && process.platform === "darwin",
});
