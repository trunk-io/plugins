import { customLinterCheckTest } from "tests";
import { skipOS } from "tests/utils";

// python missing on mac
customLinterCheckTest({
  linterName: "renovate",
  args: "-a",
  skipTestIf: skipOS(["darwin"]),
});
