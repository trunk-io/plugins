import fs from "fs";
import path from "path";
import { linterCheckTest, linterFmtTest } from "tests";
import { TrunkDriver } from "tests/driver";

// Add a .scalafmt.confg (required to run)
const preCheck = (driver: TrunkDriver) => {
  if (driver.sandboxPath) {
    fs.writeFileSync(
      // trunk-ignore(semgrep): driver.sandboxPath is generated deterministically and is safe
      path.resolve(driver.sandboxPath, ".scalafmt.conf"),
      // version in .scalafmt.conf must match the enabled version
      `version = ${driver.enabledVersion ?? "3.4.3"}\nrunner.dialect = scala3`
    );
  }
};

// scalafmt succeeds on empty files
linterCheckTest({ linterName: "scalafmt", namedTestPrefixes: ["empty"], preCheck });

linterFmtTest({ linterName: "scalafmt", namedTestPrefixes: ["basic"], preCheck });
