import { customLinterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";

// Requires SNYK_TOKEN to run
customLinterCheckTest({ linterName: "snyk", args: TEST_DATA, testName: "basic" });
