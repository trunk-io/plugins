import { linterCheckTest } from "tests";
import { skipOS } from "tests/utils";

linterCheckTest({ linterName: "shellcheck", skipTestIf: skipOS(["win32"]) });
