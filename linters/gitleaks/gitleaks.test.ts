import path from "path";
import { customLinterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";

// gitleaks version 7.0.0 only had an amd64 release asset for darwin, and our runners are x86_64.
const skipTestIf = (version?: string) => version === "7.0.0" && process.platform == "darwin";

customLinterCheckTest({
  linterName: "gitleaks",
  testName: "basic",
  args: path.join(TEST_DATA, "basic.py"),
  skipTestIf,
});
