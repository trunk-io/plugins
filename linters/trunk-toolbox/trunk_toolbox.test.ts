import { linterCheckTest } from "tests";
import { skipOS } from "tests/utils";

linterCheckTest({ linterName: "trunk-toolbox", skipTestIf: skipOS(["win32"]) });
