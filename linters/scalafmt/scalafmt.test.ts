import { linterCheckTest, linterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { skipOS } from "tests/utils";

// Add a .scalafmt.confg (required to run)
const preCheck = (driver: TrunkLintDriver) => {
  const contents = `version = ${driver.enabledVersion ?? "3.4.3"}\nrunner.dialect = scala3`;
  driver.writeFile(".scalafmt.conf", contents);
};

// scalafmt succeeds on empty files
linterCheckTest({ linterName: "scalafmt", namedTestPrefixes: ["empty"], preCheck, skipTestIf: skipOS(["win32"]) });

linterFmtTest({ linterName: "scalafmt", namedTestPrefixes: ["basic"], preCheck, skipTestIf: skipOS(["win32"]) });
