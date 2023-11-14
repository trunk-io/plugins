import { linterCheckTest, linterFmtTest } from "tests";

// TODO(Tyler): Address Go install issues
jest.retryTimes(2);

linterCheckTest({ linterName: "golines", namedTestPrefixes: ["empty"] });

linterFmtTest({ linterName: "golines", namedTestPrefixes: ["basic"] });
