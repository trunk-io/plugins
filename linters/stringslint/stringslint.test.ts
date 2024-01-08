import { customLinterCheckTest } from "tests";
import { skipOS, TEST_DATA } from "tests/utils";

// This is a Mac-exclusive linter
customLinterCheckTest({
  linterName: "stringslint",
  args: TEST_DATA,
  skipTestIf: skipOS(["linux", "win32"]),
});
