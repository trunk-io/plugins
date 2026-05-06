import * as fs from "fs";
import * as path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

// zizmor only runs on files under .github/workflows.
const moveWorkflowFiles =
  (sourceDir = TEST_DATA) =>
  async (driver: TrunkLintDriver) => {
    fs.readdirSync(path.resolve(driver.getSandbox(), sourceDir), { withFileTypes: true })
      .filter((file) => file.isFile())
      .forEach((file) => {
        driver.moveFile(path.join(sourceDir, file.name), path.join(".github/workflows", file.name));
      });
    await driver.gitDriver?.add(".").commit("moved");
  };

const skipIfMissingGitHubToken = () => {
  if (!process.env.GH_TOKEN && !process.env.GITHUB_TOKEN) {
    console.log("Skipping zizmor online audit test because GH_TOKEN and GITHUB_TOKEN are not set.");
    return true;
  }
  return false;
};

customLinterCheckTest({ linterName: "zizmor", args: ".github", preCheck: moveWorkflowFiles() });

customLinterCheckTest({
  linterName: "zizmor",
  testName: "version_comment",
  args: ".github",
  preCheck: moveWorkflowFiles(path.join(TEST_DATA, "online")),
  skipTestIf: skipIfMissingGitHubToken,
});
