import path from "path";
import { customLinterCheckTest, customLinterFmtTest } from "tests";
import { osTimeoutMultiplier, skipOS, TEST_DATA } from "tests/utils";

// Note that the first-time ruby/rufo download can sometimes take a while.
// Ruby build is quite slow on Mac, so only run tests on linux for now
jest.setTimeout(300000 * osTimeoutMultiplier); // 300s or 900s

// Rufo succeeds on empty files
customLinterCheckTest({
  linterName: "rufo",
  testName: "empty",
  args: "-a",
  skipTestIf: skipOS(["darwin", "win32"]),
});

customLinterFmtTest({
  linterName: "rufo",
  testName: "basic",
  args: "-a",
  pathsToSnapshot: [path.join(TEST_DATA, "basic.rb")],
  skipTestIf: skipOS(["darwin", "win32"]),
});
