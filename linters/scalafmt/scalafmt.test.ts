import { linterCheckTest, linterFmtTest } from "tests";
import { TrunkDriver } from "tests/driver";

// Add a .scalafmt.confg (required to run)
const preCheck = (driver: TrunkDriver) => {
  const contents = `version = ${driver.enabledVersion ?? "3.4.3"}\nrunner.dialect = scala3`;
  driver.writeFile(".scalafmt.conf", contents);
};

// scalafmt succeeds on empty files
linterCheckTest({ linterName: "scalafmt", namedTestPrefixes: ["empty"], preCheck });

linterFmtTest({ linterName: "scalafmt", namedTestPrefixes: ["basic"], preCheck });
