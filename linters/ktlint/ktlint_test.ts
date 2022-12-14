import fs from "fs";
import path from "path";
import { linterFmtTest } from "tests";
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

linterFmtTest({ linterName: "ktlint", preCheck });
