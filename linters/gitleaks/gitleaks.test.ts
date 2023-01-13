import path from "path";
import { customLinterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";

// gitleaks version 7.0.0 only had a darwin amd64 release asset
const checkLinterVersionForInclusion = (version: string) => version != "7.0.0";

customLinterCheckTest({
  linterName: "gitleaks",
  testName: "basic",
  args: path.join(TEST_DATA, "basic.py"),
  checkLinterVersionForInclusion,
});
