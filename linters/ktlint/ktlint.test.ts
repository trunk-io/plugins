import { linterFmtTest } from "tests";
import { TrunkDriver } from "tests/driver";

// Grab the root .editorconfig
const preCheck = (driver: TrunkDriver) => {
  driver.copyFileFromRoot(".editorconfig");
};

linterFmtTest({ linterName: "ktlint", preCheck });
