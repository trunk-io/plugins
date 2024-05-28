import { linterFmtTest } from "tests";
import { skipOS } from "tests/utils";

linterFmtTest({
  linterName: "php-cs-fixer",
  skipTestIf: skipOS(["win32"]),
});
