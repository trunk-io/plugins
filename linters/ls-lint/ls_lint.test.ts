import path from "path";
import { linterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";

const lsLintConfig = ".ls-lint.yml";
linterCheckTest({
  linterName: "ls-lint",
  preCheck: async (driver) => {
    console.log("driver sandbox", driver.sandboxPath);
    driver.moveFile(path.join(TEST_DATA, lsLintConfig), lsLintConfig);
    await driver.runTrunk(["tools", "install"]);
  },
});
