import * as fs from "fs";
import path from "path";
import { REPO_ROOT } from "tests/utils";

enum TestOS {
  LINUX = "ubuntu-latest",
  MAC_OS = "macos-latest",
}

type TestResultStatus = "passed" | "failed" | "skipped" | "mismatch";

interface TestResult {
  version: string;
  testNames: string[];
  testResultStatus: TestResultStatus;
}

interface TestResultSummary {
  os: TestOS | "composite";
  linters: Map<string, TestResult>;
}

const getResultsFileFromOS = (os: TestOS) => path.resolve(REPO_ROOT, `${os}-res.json`);

const parseTestStatus = (status: string): TestResultStatus => {
  switch (status) {
    case "passed":
      return "passed";
    case "pending":
      return "skipped";
    default:
      return "failed";
  }
};

const mergeTestStatuses = (
  original: TestResultStatus,
  incoming: TestResultStatus
): TestResultStatus => {
  if (incoming == "failed") {
    return "failed";
  }

  // if incoming is "skipped" or "passed", defer to the original
  return original;
};

const mergeTestResults = (original: TestResult, incoming: TestResult) => {
  const { version, testNames, testResultStatus } = incoming;
  // Merge existing composite record
  original.testNames = original.testNames.concat(testNames);
  if (version !== original.version) {
    original.testResultStatus = "mismatch";
  } else {
    original.testResultStatus = mergeTestStatuses(original.testResultStatus, testResultStatus);
  }
};

const parseResultsJson = (os: TestOS): TestResultSummary => {
  // trunk-ignore-begin(eslint/@typescript-eslint/no-unsafe-assignment)
  // trunk-ignore-begin(eslint/@typescript-eslint/no-unsafe-member-access)
  // trunk-ignore-begin(eslint/@typescript-eslint/no-unsafe-argument)
  const resultsJsonPath = getResultsFileFromOS(os);
  const jsonResult = JSON.parse(fs.readFileSync(resultsJsonPath, { encoding: "utf-8" }));

  const linterResults = new Map<string, TestResult>();

  // trunk-ignore-begin(eslint/@typescript-eslint/no-unsafe-call)
  jsonResult.testResults.forEach((testResult: any) => {
    testResult.assertionResults.forEach((assertionResult: any) => {
      const testName: string = assertionResult.ancestorTitles[0];
      const foundLinterName = testName.match(/Testing (linter|formatter) (?<linter>.+)/);
      const linterName = foundLinterName?.groups?.linter;
      if (!linterName) {
        console.warn(`Failed to parse test name from ${testName}`);
        return;
      }

      const version = assertionResult.version;
      const fullTestName = assertionResult.fullName;
      const status = parseTestStatus(assertionResult.status);

      const originaltestResult = linterResults.get(linterName);
      const newTestResult = {
        version,
        testNames: [fullTestName],
        testResultStatus: status,
      };
      if (originaltestResult) {
        mergeTestResults(originaltestResult, newTestResult);
      } else {
        // Create new composite test record
        linterResults.set(linterName, newTestResult);
      }
    });
  });
  // trunk-ignore-end(eslint/@typescript-eslint/no-unsafe-assignment)
  // trunk-ignore-end(eslint/@typescript-eslint/no-unsafe-member-access)
  // trunk-ignore-end(eslint/@typescript-eslint/no-unsafe-argument)
  // trunk-ignore-end(eslint/@typescript-eslint/no-unsafe-call)

  return {
    os,
    linters: linterResults,
  };
};

const mergeTestResultSummaries = (testResults: TestResultSummary[]): TestResultSummary => {
  const compositeLinterResults = testResults[0].linters;
  testResults.slice(1).forEach((testResult) => {
    testResult.linters.forEach((linterResult, linterName) => {
      const compositeLinterResult = compositeLinterResults.get(linterName);
      if (compositeLinterResult) {
        // Merge existing composite record
        mergeTestResults(compositeLinterResult, linterResult);
      } else {
        // Add new composite record (safety fallback)
        compositeLinterResults.set(linterName, linterResult);
      }
    });
  });

  return {
    os: "composite",
    linters: compositeLinterResults,
  };
};

const uploadTestResults = (compositeTestResult: TestResultSummary) => {
  console.log(compositeTestResult);

  // TODO: TYLER UPLOAD
  // TODO: TYLER ADD DOCS/COMMENTS TO THIS
};

const parseTestResultsAndUpload = () => {
  // Step 1: Parse each OS's results json file
  const testResults = Object.values(TestOS).map((os) => parseResultsJson(os));

  // Step 2: Merge all OS results into one composite results summary. Tests must pass with the same version on both OSs
  // in order to be recommended.
  // TODO(Tyler): Choose a minimum compliant version in the case of os-varying download versions.
  const compositeTestResult = mergeTestResultSummaries(testResults);

  // Step 3: Upload results so that recommended linter versions only come from validated versions.
  uploadTestResults(compositeTestResult);
};

parseTestResultsAndUpload();
