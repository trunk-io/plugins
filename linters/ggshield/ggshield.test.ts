import path from "path";
import { customLinterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";

customLinterCheckTest({
  linterName: "ggshield",
  testName: "basic",
  args: path.join(TEST_DATA, "basic.in.py"),
});
