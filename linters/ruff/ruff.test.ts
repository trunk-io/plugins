import { linterCheckTest, linterFmtTest } from "tests";

linterCheckTest({ linterName: "ruff" });
linterFmtTest({ linterName: "ruff" });
