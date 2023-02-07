import { linterCheckTest, linterFmtTest } from "tests";

linterFmtTest({ linterName: "remark-lint" });

linterCheckTest({ linterName: "remark-lint" });
