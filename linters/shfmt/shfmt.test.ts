import { linterCheckTest, linterFmtTest } from "tests";
import { TrunkDriver } from "tests/driver";

// Grab the root .editorconfig
const preCheck = (driver: TrunkDriver) => {
  driver.copyFileFromRoot(".editorconfig");
};

// TODO(Tyler): We will eventually need to add a couple more test cases involving formatting behavior.
linterFmtTest({ linterName: "shfmt", namedTestPrefixes: ["basic"], preCheck });
// Run check on both basic and empty to show parse error
linterCheckTest({ linterName: "shfmt", namedTestPrefixes: ["basic", "empty"], preCheck });
