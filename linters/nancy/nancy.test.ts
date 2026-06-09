import * as fs from "fs";
import * as path from "path";
import { fuzzyLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { FileIssue } from "tests/types";
import { TEST_DATA } from "tests/utils";
import { createFuzzyMatcher } from "tests/utils/landing_state";

const preCheck = (driver: TrunkLintDriver) => {
  fs.readdirSync(path.resolve(driver.getSandbox(), TEST_DATA)).forEach((file) => {
    driver.moveFile(path.join(TEST_DATA, file), file);
  });
};

// trunk-ignore(eslint/@typescript-eslint/no-unsafe-assignment)
const expectedFileIssues = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "expected_issues.json")).toString(),
);

// OSS Index rejects unauthenticated requests, so keep this integration test credential-gated.
const skipTestIf = () => {
  if (!process.env.OSS_INDEX_USERNAME || !process.env.OSS_INDEX_TOKEN) {
    console.log(
      "Skipping nancy test. Must provide OSS_INDEX_USERNAME and OSS_INDEX_TOKEN to query OSS Index.",
    );
    return true;
  }
  return false;
};

fuzzyLinterCheckTest({
  linterName: "nancy",
  args: "-a -n",
  preCheck,
  skipTestIf,
  fileIssueAssertionCallback: createFuzzyMatcher(() => expectedFileIssues as FileIssue[], 3),
});
