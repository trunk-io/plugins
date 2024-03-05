import path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

const preCheck = (driver: TrunkLintDriver) => {
  driver.moveFile(path.join(TEST_DATA, "pubspec.yaml"), "pubspec.yaml");
  driver.moveFile(path.join(TEST_DATA, "analysis_options.yaml"), "analysis_options.yaml");
};

customLinterCheckTest({
  linterName: "dart",
  args: `${TEST_DATA} -y`,
  testName: "basic",
  preCheck,
  pathsToSnapshot: [path.join(TEST_DATA, "basic.in.dart")],
});
