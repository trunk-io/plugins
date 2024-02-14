import path from "path";
import { customLinterCheckTest, customLinterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

customLinterFmtTest({
  linterName: "sort-package-json",
  testName: "basic",
  args: "-a",
  pathsToSnapshot: [path.join(TEST_DATA, "package.json")],
});

// Use file with malformed json
const preCheck = (driver: TrunkLintDriver) => {
  driver.moveFile(path.join(TEST_DATA, "bad_package.json"), path.join(TEST_DATA, "package.json"));
};

// Run with check to assert error behavior when malformed json
customLinterCheckTest({
  linterName: "sort-package-json",
  args: "-a",
  preCheck,
});
