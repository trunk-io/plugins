import { linterFmtTest } from "tests";

// TODO(Tyler): Address Go install issues
jest.retryTimes(2);

// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes and other autofixes.
linterFmtTest({ linterName: "cue-fmt" });
