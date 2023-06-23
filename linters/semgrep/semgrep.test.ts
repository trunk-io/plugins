import { customLinterCheckTest } from "tests";
import { TEST_DATA, skipOS } from "tests/utils";

// Note semgrep runs can take a while since they require downloading rulesets each time.
customLinterCheckTest({ linterName: "semgrep", args: TEST_DATA, skipTestIf: skipOS(["win32"]) });
