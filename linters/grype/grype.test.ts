import { customLinterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";

customLinterCheckTest({
  linterName: "grype",
  testName: "fs-vuln",
  args: TEST_DATA,
});
