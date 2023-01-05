import { customLinterCheckTest } from "tests";
import { TrunkDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";
import * as fs from "fs";
import * as path from "path";

// actionlint is specially triggered to run on github workflow files
const preCheck = (driver: TrunkDriver) => {
  fs.readdirSync(path.resolve(driver.getSandbox(), TEST_DATA)).forEach((file) => {
    driver.moveFile(path.join(TEST_DATA, file), path.join(".github/workflows", file));
  });
};

customLinterCheckTest({ linterName: "actionlint", preCheck });
