import path from "path";
import { customLinterCheckTest, linterCheckTest, TestCallback } from "tests";
import { TEST_DATA } from "tests/utils";

linterCheckTest({ linterName: "pyright" });

// pyright "info" and "fatal" severities only show up when certain rules are enabled in .pyrightrc.
// To test that these levels are appropriately parsed, use the following test setup.
const preCheck: TestCallback = (driver) => {
  driver.moveFile(path.join(TEST_DATA, ".pyrightrc"), ".pyrightrc");
};

customLinterCheckTest({ linterName: "pyright", testName: "config", args: "-a", preCheck });
