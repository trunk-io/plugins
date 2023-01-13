import { customLinterCheckTest } from "tests";
import { osTimeoutMultiplier, TEST_DATA } from "tests/utils";

// Note that the ruby setup can sometimes take a while.
jest.setTimeout(300000 * osTimeoutMultiplier); // 300s or 900s
customLinterCheckTest({ linterName: "brakeman", args: TEST_DATA, exclusiveOS: ["linux"] });
