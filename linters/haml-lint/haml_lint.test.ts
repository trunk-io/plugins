import { customLinterCheckTest } from "tests";
import { osTimeoutMultiplier, skipOS, TEST_DATA } from "tests/utils";

// Note that the first-time ruby/rufo download can sometimes take a while.
// Ruby build is quite slow on Mac, so only run tests on linux for now
jest.setTimeout(600000 * osTimeoutMultiplier);

// Ruby build is quite slow on Mac, so only run tests on linux for now
customLinterCheckTest({
  linterName: "haml-lint",
  args: TEST_DATA,
  skipTestIf: skipOS(["darwin"]),
});
