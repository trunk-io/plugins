import { linterCheckTest, linterFmtTest } from "tests";

// gofumpt generates a failure on an empty file
linterCheckTest({ linterName: "gofumpt", namedTestPrefixes: ["empty"] });

linterFmtTest({ linterName: "gofumpt", namedTestPrefixes: ["basic", "gofumpt"] });
