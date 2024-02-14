import { customLinterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";
customLinterCheckTest({ linterName: "tfsec", args: TEST_DATA, testName: "basic" });
