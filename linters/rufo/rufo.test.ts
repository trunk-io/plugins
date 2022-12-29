import { linterCheckTest, linterFmtTest } from "tests";

// Note that the first-time ruby/rufo download can sometimes take a while.
jest.setTimeout(300000);
// Rufo succeeds on empty files
linterCheckTest({ linterName: "rufo", namedTestPrefixes: ["empty"] });

linterFmtTest({ linterName: "rufo", namedTestPrefixes: ["basic"] });
