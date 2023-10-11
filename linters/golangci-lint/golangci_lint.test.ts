import path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { TEST_DATA, skipOS } from "tests/utils";

customLinterCheckTest({
  linterName: "golangci-lint",
  args: path.join(TEST_DATA, "basic.go"),
  testName: "basic",
});

// Don't run on Windows since the typecheck errors are dependent on system libs, and for the sake of these tests
// it is easier to simply skip these tests than handle additional setup.
customLinterCheckTest({
  linterName: "golangci-lint",
  args: "-a -y",
  testName: "all",
  skipTestIf: skipOS(["win32"]),
});

// Adding an empty file will cause some other issues to be suppressed.
const addEmpty = (driver: TrunkLintDriver) => {
  driver.writeFile(path.join(TEST_DATA, "empty.go"), "");
};

customLinterCheckTest({
  linterName: "golangci-lint",
  testName: "empty",
  args: "-a",
  preCheck: addEmpty,
});

// Having an ignored file and no other files causes an error diagnostic to be surfaced.
const setupUnbuildable = (driver: TrunkLintDriver) => {
  driver.moveFile(path.join(TEST_DATA, "unbuildable.go"), "unbuildable.go");
  driver.deleteFile(TEST_DATA);
};

// Don't run on Windows since the typecheck errors are dependent on system libs, and for the sake of these tests
// it is easier to simply skip these tests than handle additional setup.
customLinterCheckTest({
  linterName: "golangci-lint",
  testName: "unbuildable",
  args: "-a",
  preCheck: setupUnbuildable,
  skipTestIf: skipOS(["win32"]),
});
