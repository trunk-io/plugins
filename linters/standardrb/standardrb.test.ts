import { linterCheckTest, linterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { skipOS } from "tests/utils";

const preCheck = (driver: TrunkLintDriver) => {
  if (process.platform == "win32") {
    driver.writeFile(
      ".standard.yml",
      `ignore:
  - '**/*':
    - Layout/EndOfLine
`,
    );
  }
};

// Ruby build is quite slow on Mac, so only run tests on linux for now
linterCheckTest({
  linterName: "standardrb",
  preCheck,
  skipTestIf: skipOS(["darwin"]),
});

linterFmtTest({
  linterName: "standardrb",
  preCheck,
  skipTestIf: skipOS(["darwin"]),
});
