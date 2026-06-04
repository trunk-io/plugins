import * as fs from "fs";
import * as path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

const moveWorkflowFile =
  (filename: string, disableGhAuth = false) =>
  async (driver: TrunkLintDriver) => {
    if (disableGhAuth) {
      process.env.PINACT_DISABLE_GH_AUTH = "1";
    } else {
      delete process.env.PINACT_DISABLE_GH_AUTH;
    }
    driver.moveFile(path.join(TEST_DATA, filename), path.join(".github/workflows", filename));
    await driver.gitDriver?.add(".").commit("moved");
  };

const moveWorkflowFiles =
  (sourceDir = TEST_DATA) =>
  async (driver: TrunkLintDriver) => {
    delete process.env.PINACT_DISABLE_GH_AUTH;

    fs.readdirSync(path.resolve(driver.getSandbox(), sourceDir), { withFileTypes: true })
      .filter((file) => file.isFile())
      .forEach((file) => {
        driver.moveFile(path.join(sourceDir, file.name), path.join(".github/workflows", file.name));
      });
    await driver.gitDriver?.add(".").commit("moved");
  };

const enablePinactCommand =
  (command: string, preCheck?: (driver: TrunkLintDriver) => Promise<void>) =>
  async (driver: TrunkLintDriver) => {
    delete process.env.PINACT_DISABLE_GH_AUTH;

    const trunkYamlPath = ".trunk/trunk.yaml";
    const currentContents = driver.readFile(trunkYamlPath);
    const pinactRegex = /- pinact@(.+)\n/;

    driver.writeFile(
      trunkYamlPath,
      currentContents.replace(pinactRegex, `- pinact@$1:\n        commands: [${command}]\n`),
    );

    if (preCheck) {
      await preCheck(driver);
    }
  };

const skipIfMissingGitHubToken = () => {
  if (!process.env.GH_TOKEN && !process.env.GITHUB_TOKEN && !process.env.PINACT_GITHUB_TOKEN) {
    console.log(
      "Skipping pinact online audit test because GH_TOKEN, GITHUB_TOKEN, and PINACT_GITHUB_TOKEN are not set.",
    );
    return true;
  }
  return false;
};

customLinterCheckTest({
  linterName: "pinact",
  testName: "missing_version_comment",
  args: ".github",
  preCheck: moveWorkflowFile("missing_version_comment.in.yaml", true),
});

customLinterCheckTest({
  linterName: "pinact",
  testName: "unpinned",
  args: ".github",
  preCheck: moveWorkflowFile("unpinned.in.yaml", true),
});

customLinterCheckTest({
  linterName: "pinact",
  testName: "version_comment",
  args: ".github",
  preCheck: moveWorkflowFiles(path.join(TEST_DATA, "online")),
  skipTestIf: skipIfMissingGitHubToken,
});

customLinterCheckTest({
  linterName: "pinact",
  testName: "upgrade",
  args: ".github",
  preCheck: enablePinactCommand("upgrade", moveWorkflowFile("unpinned.in.yaml")),
  skipTestIf: skipIfMissingGitHubToken,
});
