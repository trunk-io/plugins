import { linterCheckTest, linterFmtTest } from "tests";

// TODO(Tyler): Address Go install issues
jest.retryTimes(2);

// goimports generates a failure on an empty file
linterCheckTest({ linterName: "goimports", namedTestPrefixes: ["empty"] });

linterFmtTest({ linterName: "goimports", namedTestPrefixes: ["basic"] });
