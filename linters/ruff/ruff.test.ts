import { linterCheckTest } from "tests";
import { skipOS } from "tests/utils";

linterCheckTest({ linterName: "ruff", namedTestPrefixes: ["basic"] });
// ruff-nbqa still runs correctly on Windows, but the diagnostics are slightly different from the assertions.
linterCheckTest({
  linterName: "ruff-nbqa",
  namedTestPrefixes: ["basic_nb"],
  skipTestIf: skipOS(["win32"]),
});
