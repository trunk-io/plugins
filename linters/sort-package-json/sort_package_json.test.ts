import path from "path";
import { customLinterCheckTest, customLinterFmtTest } from "tests";
import { TrunkDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

customLinterFmtTest({
  linterName: "sort-package-json",
  args: "--all",
  pathsToSnapshot: [path.join(TEST_DATA, "package.json")],
});

// Use file with malformed json
const preCheck = (driver: TrunkDriver) => {
  driver.moveFile(path.join(TEST_DATA, "bad_package.json"), path.join(TEST_DATA, "package.json"));
};

// Run with check to assert error behavior when malformed json
customLinterCheckTest({ linterName: "sort-package-json", args: "--all", preCheck });
