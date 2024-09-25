import semver from "semver";
import { linterCheckTest } from "tests";

// Squawk first supported linux arm in 1.4.0 https://github.com/sbdchd/squawk/issues/372
linterCheckTest({
  linterName: "squawk",
  skipTestIf: (version) =>
    process.arch === "arm64" &&
    process.platform === "linux" &&
    version !== undefined &&
    semver.lt(version, "1.4.0"),
});
