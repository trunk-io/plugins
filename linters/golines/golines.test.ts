import { linterCheckTest, linterFmtTest } from "tests";

linterCheckTest({ linterName: "golines", namedTestPrefixes: ["empty"] });

linterFmtTest({ linterName: "golines", namedTestPrefixes: ["basic"] });
