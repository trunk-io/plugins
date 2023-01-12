import { linterCheckTest, linterFmtTest } from "tests";
import { OSTimeoutMultiplier } from "tests/utils";

// Note that the first-time ruby/rufo download can sometimes take a while.
jest.setTimeout(300000 * OSTimeoutMultiplier); // 300s or 600s

// Rufo succeeds on empty files
linterCheckTest({ linterName: "rufo", namedTestPrefixes: ["empty"] });

linterFmtTest({ linterName: "rufo", namedTestPrefixes: ["basic"] });
