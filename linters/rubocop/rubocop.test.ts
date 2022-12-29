import { linterCheckTest, linterFmtTest } from "tests";

linterCheckTest({ linterName: "rubocop" });
linterFmtTest({ linterName: "rubocop" });
