import path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

const preCheck = (driver: TrunkDriver) => {
  ["go.mod", ".golangci.yml"].forEach((file) => {
    // trunk-ignore(semgrep): paths used here are safe
    driver.moveFile(path.join(TEST_DATA, file), file);
  });
};

customLinterCheckTest({ linterName: "golangci-lint", args: "-a -y", preCheck });

// Adding an empty file will cause some other issues to be suppressed.
const addEmpty = (driver: TrunkDriver) => {
  driver.writeFile("empty.go", "");
};

customLinterCheckTest({
  linterName: "golangci-lint",
  testName: "empty",
  args: "-a",
  preCheck: addEmpty,
});

// Having an ignored file and no other files causes an error diagnostic to be surfaced.
const setupUnbuildable = (driver: TrunkDriver) => {
  driver.moveFile(path.join(TEST_DATA, "unbuildable.go"), "unbuildable.go");
  driver.deleteFile(TEST_DATA);
};

customLinterCheckTest({
  linterName: "golangci-lint",
  testName: "unbuildable",
  args: "-a",
  preCheck: setupUnbuildable,
});
