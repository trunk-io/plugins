import path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

customLinterCheckTest({ linterName: "golangci-lint", args: "-a -y" });

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

customLinterCheckTest({
  linterName: "golangci-lint",
  testName: "unbuildable",
  args: "-a",
  preCheck: setupUnbuildable,
});
