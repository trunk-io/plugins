import { customLinterCheckTest } from "tests";
import { osTimeoutMultiplier, TEST_DATA } from "tests/utils";

// Note that the ruby setup can sometimes take a while.
jest.setTimeout(600000 * osTimeoutMultiplier); // 600s or 1200s
customLinterCheckTest({ linterName: "brakeman", args: TEST_DATA });
