import { linterCheckTest, linterFmtTest } from "tests";
import { skipOS } from "tests/utils";

linterFmtTest({ linterName: "remark-lint", skipTestIf: skipOS(["win32"]) });

linterCheckTest({ linterName: "remark-lint", skipTestIf: skipOS(["win32"]) });
