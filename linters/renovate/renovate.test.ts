import { customLinterCheckTest } from "tests";
import { skipOS } from "tests/utils";

// TODO(Tyler): Fix custom parsers sometimes breaking on Mac
// python missing on mac
customLinterCheckTest({
  linterName: "renovate",
  args: "-a",
  skipTestIf: skipOS(["darwin"]),
});
