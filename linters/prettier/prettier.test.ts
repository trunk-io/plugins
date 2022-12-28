import fs from "fs";
import path from "path";
import { linterFmtTest } from "tests";
import { TrunkDriver } from "tests/driver";
import { REPO_ROOT } from "tests/utils";

// Grab the root .prettierrc.yaml
// TODO(Tyler): This is something we should automatically do by default in the TrunkDriver
const preCheck = (driver: TrunkDriver) => {
  if (driver.sandboxPath) {
    fs.copyFileSync(
      path.resolve(REPO_ROOT, ".trunk/configs/.prettierrc.yaml"),
      // trunk-ignore(semgrep): driver.sandboxPath is generated deterministically and is safe
      path.resolve(driver.sandboxPath, ".prettierrc.yaml")
    );
  }
};

// TODO(Tyler): We will eventually need to add a couple more test cases involving other file types.
linterFmtTest({ linterName: "prettier", preCheck });
