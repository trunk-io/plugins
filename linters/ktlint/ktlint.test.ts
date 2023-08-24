import { linterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";

// Grab the root .editorconfig
const preCheck = (driver: TrunkLintDriver) => {
  driver.copyFileFromRoot(".editorconfig");
};

linterFmtTest({ linterName: "ktlint", preCheck });
