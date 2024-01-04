import path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { skipOS, TEST_DATA } from "tests/utils";

// Don't run on Windows since the typecheck errors are dependent on system libs, and the set of diagnostics seems to vary.
customLinterCheckTest({
  linterName: "golangci-lint",
  args: `${TEST_DATA} -y`,
  testName: "all",
  skipTestIf: skipOS(["win32"]),
});

// Adding an empty file will cause some other issues to be suppressed.
const addEmpty = (driver: TrunkLintDriver) => {
  driver.writeFile(path.join(TEST_DATA, "empty.go"), "");
};

// Don't run on Windows since the typecheck errors are dependent on system libs, and for the sake of these tests
// it is easier to simply skip these tests than handle additional setup.
customLinterCheckTest({
  linterName: "golangci-lint",
  testName: "empty",
  args: TEST_DATA,
  preCheck: addEmpty,
  skipTestIf: skipOS(["win32"]),
});

// Having an ignored file and no other files causes an error diagnostic to be surfaced.
const setupUnbuildable = (driver: TrunkLintDriver) => {
  driver.moveFile(path.join(TEST_DATA, "unbuildable.go"), "unbuildable.go");
  driver.deleteFile(TEST_DATA);
};

customLinterCheckTest({
  linterName: "golangci-lint",
  testName: "unbuildable",
  args: "unbuildable.go",
  preCheck: setupUnbuildable,
});
