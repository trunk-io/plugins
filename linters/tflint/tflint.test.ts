import path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

const preCheckBadConfig = (driver: TrunkLintDriver) => {
  driver.moveFile(path.join(TEST_DATA, "bad.tflint.hcl"), path.join(".tflint.hcl"));
  driver.moveFile(path.join(TEST_DATA, "aws.tf"), path.join("aws.tf"));
};

// Running tflint uses calls to GitHub's APIs. If you are concerned about rate limits, disable this test locally.
// Because of these rate limits, this test is frequently flaky, so it is disabled for now.
// customLinterCheckTest({ linterName: "tflint", args: "-a" });
customLinterCheckTest({
  linterName: "tflint",
  testName: "bad_config",
  preCheck: preCheckBadConfig,
});
