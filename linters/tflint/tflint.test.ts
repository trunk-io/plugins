import path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

// const preCheck = (driver: TrunkDriver) => {
//   driver.moveFile(path.join(TEST_DATA, ".tflint.hcl"), path.join(".tflint.hcl"));
//   driver.moveFile(path.join(TEST_DATA, "aws.tf"), path.join("aws.tf"));
// };

const preCheckBadConfig = (driver: TrunkDriver) => {
  driver.moveFile(path.join(TEST_DATA, "bad.tflint.hcl"), path.join(".tflint.hcl"));
  driver.moveFile(path.join(TEST_DATA, "aws.tf"), path.join("aws.tf"));
};

// Running tflint uses calls to GitHub's APIs. If you are concerned about rate limits, disable this test locally.
// Because of these rate limits, this test is frequently flaky, so it is disabled for now.
// customLinterCheckTest({ linterName: "tflint", preCheck });
customLinterCheckTest({
  linterName: "tflint",
  testName: "bad_config",
  preCheck: preCheckBadConfig,
});
