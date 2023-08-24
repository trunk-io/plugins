import { linterCheckTest } from "tests";
import { skipOS } from "tests/utils";

linterCheckTest({
  linterName: "perlcritic",
  namedTestPrefixes: ["basic"],
  skipTestIf: skipOS(["win32"]),
});
