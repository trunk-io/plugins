import path from "path";
import { customLinterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";

// jscpd compares files against each other, so it runs once from the workspace root.
customLinterCheckTest({
  linterName: "jscpd",
  testName: "basic",
  args: path.join(TEST_DATA, "basic.in.ts"),
});
