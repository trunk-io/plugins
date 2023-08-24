import { linterFmtTest } from "tests";
import { skipOS } from "tests/utils";

linterFmtTest({
  linterName: "perltidy",
  namedTestPrefixes: ["basic"],
  skipTestIf: skipOS(["win32"]),
});
