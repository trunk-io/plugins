import * as fs from "fs";
import * as path from "path";
import { fuzzyLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { FileIssue } from "tests/types";
import { TEST_DATA } from "tests/utils";
import { createFuzzyMatcher } from "tests/utils/landing_state";

const preCheck = (driver: TrunkLintDriver) => {
  // trunk-ignore-begin(semgrep): driver.getSandbox() is generated during testing and is safe
  fs.readdirSync(path.resolve(driver.getSandbox(), TEST_DATA)).forEach((file) => {
    driver.moveFile(path.join(TEST_DATA, file), file);
  });
  // trunk-ignore-end(semgrep)
};

// trunk-ignore(eslint/@typescript-eslint/no-unsafe-assignment)
const expectedFileIssues = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "expected_issues.json")).toString()
);

fuzzyLinterCheckTest({
  linterName: "nancy",
  args: "-a -y",
  preCheck,
  fileIssueAssertionCallback: createFuzzyMatcher(() => expectedFileIssues as FileIssue[], 24),
});
