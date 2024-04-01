import { linterCheckTest } from "tests";
import { skipOS } from "tests/utils";

linterCheckTest({ linterName: "phpstan", skipTestIf: skipOS(["win32"]) });
