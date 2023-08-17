import * as fs from "fs";
import path from "path";
import { customLinterCheckTest, fuzzyLinterCheckTest, TestCallback } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { FileIssue } from "tests/types";
import { TEST_DATA } from "tests/utils";
import { createFuzzyMatcher } from "tests/utils/landing_state";

const callbackGenerator =
  (command: string, otherPreCheck?: (driver: TrunkLintDriver) => void): TestCallback =>
  (driver) => {
    const trunkYamlPath = ".trunk/trunk.yaml";
    const currentContents = driver.readFile(trunkYamlPath);
    const trivyRegex = /- trivy@(.+)\n/;
    const newContents = currentContents.replace(
      trivyRegex,
      `- trivy@$1:\n        commands: [${command}]\n`,
    );
    driver.writeFile(trunkYamlPath, newContents);
    if (otherPreCheck) {
      otherPreCheck(driver);
    }
  };

const configExpectedFileIssues = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "config_expected_issues.json")).toString(),
) as FileIssue[];

fuzzyLinterCheckTest({
  linterName: "trivy",
  testName: "config",
  args: "-a -y",
  fileIssueAssertionCallback: createFuzzyMatcher(
    () => configExpectedFileIssues,
    Math.floor(0.9 * configExpectedFileIssues.length),
  ),
  preCheck: callbackGenerator("config"),
});

const vulnExpectedFileIssues = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "vuln_expected_issues.json")).toString(),
) as FileIssue[];

fuzzyLinterCheckTest({
  linterName: "trivy",
  testName: "fs-vuln",
  args: "-a -y",
  fileIssueAssertionCallback: createFuzzyMatcher(
    () => vulnExpectedFileIssues,
    Math.floor(0.9 * vulnExpectedFileIssues.length),
  ),
  preCheck: callbackGenerator("fs-vuln"),
});

// trivy won't scan files with "/test" in the filepath
const secretPreCheck = (driver: TrunkLintDriver) => {
  driver.moveFile(path.join(TEST_DATA, "secrets.py"), path.join("other_data", "secrets.py"));
};

customLinterCheckTest({
  linterName: "trivy",
  testName: "fs-secret",
  args: "-a -y",
  preCheck: callbackGenerator("fs-secret", secretPreCheck),
});
