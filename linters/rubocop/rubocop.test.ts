import path from "path";
import { customLinterCheckTest, customLinterFmtTest } from "tests";
import { TEST_DATA } from "tests/utils";

// Ruby build is quite slow on Mac, so only run tests on linux for now
customLinterCheckTest({
  linterName: "rubocop",
  testName: "basic",
  args: "-a",
  exclusiveOS: ["linux"],
});
customLinterFmtTest({
  linterName: "rubocop",
  args: "-a",
  pathsToSnapshot: [path.join(TEST_DATA, "basic.rb")],
  exclusiveOS: ["linux"],
});
