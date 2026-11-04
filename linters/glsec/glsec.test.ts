import * as path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

// glsec only runs on GitLab CI pipeline files, so the input becomes .gitlab-ci.yml.
const moveToPipelineFile = async (driver: TrunkLintDriver) => {
  driver.moveFile(path.join(TEST_DATA, "basic.in.yaml"), ".gitlab-ci.yml");
  await driver.gitDriver?.add(".").commit("moved");
};

customLinterCheckTest({
  linterName: "glsec",
  args: ".gitlab-ci.yml",
  preCheck: moveToPipelineFile,
});
