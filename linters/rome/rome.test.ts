import { linterCheckTest, linterFmtTest } from "tests";

// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes and other autofixes.
linterCheckTest({ linterName: "rome", namedTestPrefixes: ["basic_check"] });

linterFmtTest({ linterName: "rome", namedTestPrefixes: ["basic_fmt"] });
