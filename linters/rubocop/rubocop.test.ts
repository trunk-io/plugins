import path from "path";
import { customLinterCheckTest, customLinterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { osTimeoutMultiplier, skipOS, TEST_DATA } from "tests/utils";

// Note that the first-time ruby/rufo download can sometimes take a while.
// Ruby build is quite slow on Mac, so only run tests on linux for now
jest.setTimeout(600000 * osTimeoutMultiplier);

const preCheck = (driver: TrunkLintDriver) => {
  if (process.platform == "win32") {
    driver.writeFile(
      ".rubocop.yml",
      `Layout/EndOfLine:
  Enabled: false
`,
    );
  }
};

// Ruby build is quite slow on Mac, so only run tests on linux for now
customLinterCheckTest({
  linterName: "rubocop",
  testName: "basic",
  args: TEST_DATA,
  preCheck,
  skipTestIf: skipOS(["darwin"]),
});

customLinterFmtTest({
  linterName: "rubocop",
  testName: "basic",
  args: TEST_DATA,
  pathsToSnapshot: [path.join(TEST_DATA, "basic.rb")],
  preCheck,
  skipTestIf: skipOS(["darwin"]),
});
