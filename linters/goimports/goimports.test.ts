import { linterCheckTest, linterFmtTest } from "tests";

// goimports generates a failure on an empty file
linterCheckTest({ linterName: "goimports", namedTestPrefixes: ["empty"] });

linterFmtTest({ linterName: "goimports", namedTestPrefixes: ["basic"] });
