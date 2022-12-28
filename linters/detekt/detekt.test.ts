import * as fs from "fs";
import * as path from "path";
import { linterCheckTest } from "tests";
import { TrunkDriver } from "tests/driver";

// Running check on the input manually requires the existence of a top level .detekt.yaml
const preCheck = (driver: TrunkDriver) => {
  if (driver.sandboxPath) {
    // trunk-ignore(semgrep): driver.sandboxPath is generated deterministically and is safe
    fs.writeFileSync(path.resolve(driver.sandboxPath, ".detekt.yaml"), "");
  }
};

// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes.
linterCheckTest({ linterName: "detekt", namedTestPrefixes: ["basic_detekt"], preCheck });

// detekt-explicit has no default settings, leading to an empty result
linterCheckTest({ linterName: "detekt-explicit", namedTestPrefixes: ["basic_explicit"], preCheck });
