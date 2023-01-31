import path from "path";
import { customLinterCheckTest, linterCheckTest, TestCallback } from "tests";
import { TEST_DATA } from "tests/utils";

linterCheckTest({ linterName: "pylint" });

// pylint "info" and "fatal" severities only show up when certain rules are enabled in .pylintrc.
// To test that these levels are appropriately parsed, use the following test setup.
const preCheck: TestCallback = (driver) => {
  driver.moveFile(path.join(TEST_DATA, ".pylintrc"), ".pylintrc");
};

customLinterCheckTest({ linterName: "pylint", testName: "config", args: "-a", preCheck });
