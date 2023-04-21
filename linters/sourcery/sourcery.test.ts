import { customLinterCheckTest, linterCheckTest } from "tests";

linterCheckTest({ linterName: "sourcery" });

// sourcer "info" and "fatal" severities only show up when certain rules are enabled in .sourceryrc.
// To test that these levels are appropriately parsed, use the following test setup.

customLinterCheckTest({ linterName: "sourcery", testName: "config" });
