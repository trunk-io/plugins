import { customLinterCheckTest } from "tests";
import { osTimeoutMultiplier, skipOS, TEST_DATA } from "tests/utils";

// Note that the ruby setup can sometimes take a while.
// Ruby build is quite slow on Mac, so only run tests on linux for now
jest.setTimeout(300000 * osTimeoutMultiplier); // 300s or 900s
customLinterCheckTest({
  linterName: "brakeman",
  args: TEST_DATA,
  skipTestIf: skipOS(["darwin", "win32"]),
});
