import { customLinterCheckTest } from "tests";

// TODO(Tyler): Address Go install issues
jest.retryTimes(2);

customLinterCheckTest({ linterName: "dustilock", args: "-a" });
