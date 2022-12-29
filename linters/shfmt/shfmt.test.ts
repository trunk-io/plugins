import fs from "fs";
import path from "path";
import { linterCheckTest, linterFmtTest } from "tests";
import { TrunkDriver } from "tests/driver";
import { REPO_ROOT } from "tests/utils";

// Grab the root .editorconfig
// TODO(Tyler): This is something we should automatically do by default in the TrunkDriver
const preCheck = (driver: TrunkDriver) => {
  if (driver.sandboxPath) {
    fs.copyFileSync(
      path.resolve(REPO_ROOT, ".editorconfig"),
      // trunk-ignore(semgrep): driver.sandboxPath is generated deterministically and is safe
      path.resolve(driver.sandboxPath, ".editorconfig")
    );
  }
};

// TODO(Tyler): We will eventually need to add a couple more test cases involving formatting behavior.
linterFmtTest({ linterName: "shfmt", namedTestPrefixes: ["basic"], preCheck });
// Run check on both basic and empty to show parse error
linterCheckTest({ linterName: "shfmt", namedTestPrefixes: ["basic", "empty"], preCheck });
