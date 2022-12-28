import { linterCheckTest, linterFmtTest } from "tests";

// gofmt generates a failure on an empty file
linterCheckTest({ linterName: "gofmt", namedTestPrefixes: ["empty"] });

linterFmtTest({ linterName: "gofmt", namedTestPrefixes: ["basic"] });
