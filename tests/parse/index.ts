import * as fs from "fs";
import path from "path";
import {
  TestOS,
  TestResult,
  TestResultStatus,
  TestResultSummary,
  ValidatedVersion,
} from "tests/types";
import { REPO_ROOT } from "tests/utils";
import { getTrunkVersion } from "tests/utils/trunk_config";

const RESULTS_FILE = path.resolve(REPO_ROOT, "results.json");

/**
 * Convert an OS into the expected file path.
 */
const getResultsFileFromOS = (os: TestOS) => path.resolve(REPO_ROOT, `${os}-res.json`);

/**
 * Convert the name that jest uses for test status into a `TestResultStatus`.
 */
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

/**
 * Merge the status of multiple tests into one.
 * Skipped tests are overriden by failed or passed.
 * Passed tests are overriden by failed tests.
 */
const mergeTestStatuses = (
  original: TestResultStatus,
  incoming: TestResultStatus
): TestResultStatus => {
  if (incoming == "failed") {
    return incoming;
  } else if (original == "skipped") {
    return incoming;
  }

  // if incoming is "skipped" or "passed", defer to the original
  return original;
};

/**
 * Merge the result of multiple tests into one. Concatenates test names, intelligently merges statuses,
 * and handles version mismatches.
 */
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

/**
 * Parse the results of tests run on a singular OS. Merges multiple tests per linter.
 */
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

  console.log(`Parsed results for ${os}`);
  return {
    os,
    linters: linterResults,
  };
};

/**
 * Merge the result summaries of multiple OS tests. Merges serially such that all tests for a linter must have the
 * same version and all tests must be skipped or pass to be considered passed.
 */
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

/**
 * Write composite test results to `RESULTS_FILE` so that they may be uploaded via trunk CLI.
 */
const writeTestResults = (testResults: TestResultSummary) => {
  const cliVersion = getTrunkVersion();
  const pluginVersion = "v0.0.10"; // TODO(Tyler): Iron out ref for nightly runs.
  const validatedVersions = Array.from(testResults.linters).reduce(
    (accumulator: ValidatedVersion[], [linter, { version, testResultStatus }]) => {
      if (testResultStatus === "passed" && version) {
        const additionalValidatedVersion: ValidatedVersion = { linter, version };
        return accumulator.concat([additionalValidatedVersion]);
      }
      return accumulator;
    },
    []
  );

  const outObject = {
    cliVersion,
    pluginVersion,
    validatedVersions,
  };
  const outString = JSON.stringify(outObject);
  fs.writeFileSync(RESULTS_FILE, outString);
  console.log(`Wrote results out to ${RESULTS_FILE}:`);
  console.log(outString);
};

const parseTestResultsAndWrite = () => {
  // Step 1: Parse each OS's results json file. If one of the expected files does not exist, throw and error out.
  const testResults = Object.values(TestOS).map((os) => parseResultsJson(os));

  // Step 2: Merge all OS results into one composite results summary. Tests must pass with the same version on both OSs
  // in order to be recommended.
  // TODO(Tyler): Choose a minimum compliant version in the case of os-varying download versions.
  const compositeTestResult = mergeTestResultSummaries(testResults);

  // Step 3: Dump results to json file.
  writeTestResults(compositeTestResult);
};

parseTestResultsAndWrite();
