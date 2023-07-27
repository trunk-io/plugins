import { linterCheckTest, linterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { skipCPUOS, skipOS } from "tests/utils";

// Add a .scalafmt.confg (required to run)
const preCheck = (driver: TrunkLintDriver) => {
  const contents = `version = ${driver.enabledVersion ?? "3.4.3"}\nrunner.dialect = scala3`;
  driver.writeFile(".scalafmt.conf", contents);
};

const skipTestIfLambda = (version?: string | undefined) =>
  skipOS(["win32"])(version) || skipCPUOS([{ os: "linux", cpu: "arm64" }])(version);

// scalafmt succeeds on empty files
linterCheckTest({
  linterName: "scalafmt",
  namedTestPrefixes: ["empty"],
  preCheck,
  skipTestIf: skipTestIfLambda,
});

linterFmtTest({
  linterName: "scalafmt",
  namedTestPrefixes: ["basic"],
  preCheck,
  skipTestIf: skipTestIfLambda,
});
