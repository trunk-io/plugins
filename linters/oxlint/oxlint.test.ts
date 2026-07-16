import { linterCheckTest, linterFmtTest } from "tests";

linterCheckTest({ linterName: "oxlint", namedTestPrefixes: ["basic"] });
linterFmtTest({ linterName: "oxlint", namedTestPrefixes: ["format"] });
