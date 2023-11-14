import { linterFmtTest } from "tests";

// TODO(Tyler): Address Go install issues
jest.retryTimes(2);

linterFmtTest({ linterName: "txtpbfmt", namedTestPrefixes: ["test0", "test1"] });
