import * as fs from "fs";
import * as path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

const preCheck = (driver: TrunkDriver) => {
  // trunk-ignore-begin(semgrep): driver.getSandbox() is generated during testing and is safe
  fs.readdirSync(path.resolve(driver.getSandbox(), TEST_DATA)).forEach((file) => {
    driver.moveFile(path.join(TEST_DATA, file), file);
  });
  // trunk-ignore-end(semgrep)
};

customLinterCheckTest({ linterName: "nancy", args: "-a", preCheck });
