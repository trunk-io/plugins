import { linterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { skipOS } from "tests/utils";

// Grab the root .editorconfig
const preCheck = (driver: TrunkLintDriver) => {
  driver.copyFileFromRoot(".editorconfig");
};

linterFmtTest({ linterName: "ktlint", preCheck, skipTestIf: skipOS(["win32"]) });
