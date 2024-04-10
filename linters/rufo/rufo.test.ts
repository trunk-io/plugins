import path from "path";
import { customLinterCheckTest, customLinterFmtTest } from "tests";
import { osTimeoutMultiplier, skipOS, TEST_DATA } from "tests/utils";

// Note that the first-time ruby/rufo download can sometimes take a while.
// Ruby build is quite slow on Mac, so only run tests on linux for now
jest.setTimeout(600000 * osTimeoutMultiplier);

// Rufo succeeds on empty files
customLinterCheckTest({
  linterName: "rufo",
  testName: "empty",
  args: TEST_DATA,
  skipTestIf: skipOS(["darwin"]),
});

customLinterFmtTest({
  linterName: "rufo",
  testName: "basic",
  args: TEST_DATA,
  pathsToSnapshot: [path.join(TEST_DATA, "basic.rb")],
  skipTestIf: skipOS(["darwin"]),
});
