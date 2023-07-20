import { customLinterCheckTest } from "tests";
import { skipOS } from "tests/utils";

// This is a Mac-exclusive linter
customLinterCheckTest({
  linterName: "stringslint",
  args: "-a",
  skipTestIf: skipOS(["linux", "win32"]),
});
