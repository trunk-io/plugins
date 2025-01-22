import { customLinterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";

customLinterCheckTest({ linterName: "snyk", args: TEST_DATA, testName: "basic" });
