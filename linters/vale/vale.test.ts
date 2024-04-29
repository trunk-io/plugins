import * as path from "path";
import { customLinterCheckTest, fuzzyLinterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";
import { createFuzzyMatcher } from "tests/utils/landing_state";
import * as fs from "fs";
import { FileIssue, LandingState } from "tests/types";

// Specify a path and file to avoid linting a bad file on a happy case.
customLinterCheckTest({
  linterName: "vale",
  testName: "basic",
  args: path.join(TEST_DATA, "documents/README.md"),
});

const expectedBasicFileIssues = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "expected_issues.json")).toString(),
);

fuzzyLinterCheckTest({
  linterName: "vale",
  testName: "poor spelling",
  args: path.join(TEST_DATA, "documents/BAD_FILE.md"),
  fileIssueAssertionCallback: createFuzzyMatcher(() => expectedBasicFileIssues as FileIssue[], 2),
});
