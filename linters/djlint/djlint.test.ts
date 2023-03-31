import { linterCheckTest, linterFmtTest } from "tests";

// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes and other packages.
linterCheckTest({ linterName: "djlint" });
linterFmtTest({ linterName: "djlint" });
