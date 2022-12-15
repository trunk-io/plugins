import { linterCheckTest, linterFmtTest } from "tests";

// rustfmt succeeds on empty files
linterCheckTest({ linterName: "rustfmt", namedTestPrefixes: ["empty"] });

linterFmtTest({ linterName: "rustfmt", namedTestPrefixes: ["basic"] });
