import * as fs from "fs";
import path from "path";
import { customLinterCheckTest, fuzzyLinterCheckTest, TestCallback } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { FileIssue } from "tests/types";
import { TEST_DATA } from "tests/utils";
import { createFuzzyMatcher } from "tests/utils/landing_state";

const callbackGenerator =
  (command: string, otherPreCheck?: TestCallback): TestCallback =>
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
  args: "-a",
  fileIssueAssertionCallback: createFuzzyMatcher(() => configExpectedFileIssues, 13),
  preCheck: callbackGenerator("config"),
});

const vulnExpectedFileIssues = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "vuln_expected_issues.json")).toString(),
) as FileIssue[];

fuzzyLinterCheckTest({
  linterName: "trivy",
  testName: "fs-vuln",
  args: "-a",
  fileIssueAssertionCallback: createFuzzyMatcher(() => vulnExpectedFileIssues, 30),
  preCheck: callbackGenerator("fs-vuln"),
});

// trivy won't scan files with "/test" in the filepath
const secretPreCheck = (driver: TrunkLintDriver) => {
  driver.moveFile(path.join(TEST_DATA, "secrets.py"), path.join("other_data", "secrets.py"));
};

customLinterCheckTest({
  linterName: "trivy",
  testName: "fs-secret",
  args: "-a",
  preCheck: callbackGenerator("fs-secret", secretPreCheck),
});
