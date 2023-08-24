import path from "path";
import { customLinterCheckTest, customLinterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { skipOS, TEST_DATA } from "tests/utils";

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
  args: "-a",
  preCheck,
  skipTestIf: skipOS(["darwin"]),
});

customLinterFmtTest({
  linterName: "rubocop",
  testName: "basic",
  args: "-a",
  pathsToSnapshot: [path.join(TEST_DATA, "basic.rb")],
  preCheck,
  skipTestIf: skipOS(["darwin"]),
});
