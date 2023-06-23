import { customLinterCheckTest } from "tests";
import { skipOS } from "tests/utils";

// Ruby build is quite slow on Mac, so only run tests on linux for now
customLinterCheckTest({
  linterName: "standardrb",
  args: "-a",
  skipTestIf: skipOS(["darwin", "win32"]),
});
