import { linterCheckTest, linterFmtTest } from "tests";

// TODO(Tyler): Address Go install issues
jest.retryTimes(2);

// gofumpt generates a failure on an empty file
linterCheckTest({ linterName: "gofumpt", namedTestPrefixes: ["empty"] });

linterFmtTest({ linterName: "gofumpt", namedTestPrefixes: ["basic", "gofumpt"] });
