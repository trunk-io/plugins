import path from "path";
import { customLinterCheckTest, customLinterFmtTest } from "tests";
import { osTimeoutMultiplier, TEST_DATA } from "tests/utils";

// Note that the first-time ruby/rufo download can sometimes take a while.
// Ruby build is quite slow on Mac, so only run tests on linux for now
jest.setTimeout(300000 * osTimeoutMultiplier); // 300s or 900s

// Rufo succeeds on empty files
customLinterCheckTest({
  linterName: "rufo",
  testName: "empty",
  args: "-a",
  exclusiveOS: ["linux"],
});

customLinterFmtTest({
  linterName: "rufo",
  args: "-a",
  pathsToSnapshot: [path.join(TEST_DATA, "basic.rb")],
  exclusiveOS: ["linux"],
});
