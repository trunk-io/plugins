import * as fs from "fs";
import path from "path";
import { fuzzyLinterCheckTest } from "tests";
import { FileIssue } from "tests/types";
import { createFuzzyMatcher } from "tests/utils/landing_state";

// trunk-ignore(eslint/@typescript-eslint/no-unsafe-assignment)
const expectedFileIssues = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "expected_issues.json")).toString(),
);

fuzzyLinterCheckTest({
  linterName: "osv-scanner",
  args: "-a -y",
  fileIssueAssertionCallback: createFuzzyMatcher(() => expectedFileIssues as FileIssue[], 100),
});
