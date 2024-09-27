import * as fs from "fs";
import * as path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

// actionlint is specially triggered to run on github workflow files
const preCheck = async (driver: TrunkLintDriver) => {
  fs.readdirSync(path.resolve(driver.getSandbox(), TEST_DATA)).forEach((file) => {
    driver.moveFile(path.join(TEST_DATA, file), path.join(".github/workflows", file));
  });
  await driver.gitDriver?.add(".").commit("moved");
};

customLinterCheckTest({ linterName: "actionlint", args: ".github", preCheck });
