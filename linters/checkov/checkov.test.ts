import { linterCheckTest } from "tests";
import { skipOS } from "tests/utils";

linterCheckTest({ linterName: "checkov", skipTestIf: skipOS(["win32"]) });
