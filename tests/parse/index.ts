import * as fs from "fs";
import path from "path";
import {
  FailedVersion,
  TestOS,
  TestResult,
  TestResultStatus,
  TestResultSummary,
  ValidatedVersion,
} from "tests/types";
import { REPO_ROOT } from "tests/utils";
import { getTrunkVersion } from "tests/utils/trunk_config";

const RESULTS_FILE = path.resolve(REPO_ROOT, "results.json");
const FAILURES_FILE = path.resolve(REPO_ROOT, "failures.json");

const RUN_ID = process.env.RUN_ID ?? "";
const TEST_REF = process.env.TEST_REF ?? "latest release";
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY ?? "missing_repo";
const PARSE_STRICTNESS = process.env.PARSE_STRICTNESS;
// If "none", don't generate failures for version mismatches.
const PLUGIN_VERSION = process.env.PLUGIN_VERSION ?? "v0.0.10";
if (!process.env.PLUGIN_VERSION) {
  console.log("Environment var `PLUGIN_VERSION` is not set, using fallback `v0.0.10`");
}

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
  incoming: TestResultStatus,
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
 * Combine maps of versions run on each OS.
 */
const mergeTestVersions = (original: TestResult, incoming: TestResult) => {
  Array.from(incoming.allVersions).reduce((accumulator, [os, versions]) => {
    const originalOsVersions = original.allVersions.get(os) ?? new Set<string>();
    versions.forEach((version) => originalOsVersions.add(version));
    accumulator.set(os, originalOsVersions);

    return accumulator;
  }, original.allVersions);
};

/**
 * Merge the result of multiple tests into one. Concatenates test names, intelligently merges statuses,
 * and handles version mismatches.
 */
const mergeTestResults = (original: TestResult, incoming: TestResult) => {
  const { version, testNames, testResultStatus } = incoming;
  // Merge existing composite record
  original.testNames = original.testNames.concat(testNames);
  if (version && original.version && version !== original.version && PARSE_STRICTNESS !== "none") {
    original.testResultStatus = "mismatch";
    mergeTestVersions(original, incoming);
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
  const linterResults = new Map<string, TestResult>();

  let jsonResult;
  try {
    jsonResult = JSON.parse(fs.readFileSync(resultsJsonPath, { encoding: "utf-8" }));
  } catch (error) {
    console.warn(`Failed to parse ${resultsJsonPath}. Skipping`);
    return {
      os,
      linters: linterResults,
    };
  }

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
      const newResultAllVersions = new Map();
      newResultAllVersions.set(os, new Set([version]));
      const newTestResult = {
        version,
        testNames: [fullTestName],
        testResultStatus: status,
        allVersions: newResultAllVersions,
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
 * Write the payload for a slack notification on test failures.
 */
const writeFailuresForNotification = (failures: FailedVersion[]) => {
  const allBlocks = failures.map(({ linter, version, status, allVersions }) => {
    const linterVersion = version ? `${linter}@${version}` : linter;
    let details = "";
    if (status == "mismatch") {
      details = Array.from(allVersions)
        .map(([os, versions]) => `${os}: ${Array.from(versions).join(", ")}`)
        .join("; ");
    }
    return {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${TEST_REF} Test Failure: <https://github.com/${GITHUB_REPOSITORY}/actions/runs/${RUN_ID}| Testing latest ${linterVersion} > _STATUS: ${status}_ ${details}`,
      },
    };
  });

  const remainingBlock = {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `${TEST_REF} Test Failure: <https://github.com/${GITHUB_REPOSITORY}/actions/runs/${RUN_ID}| _And ${
        allBlocks.length - 50
      } more_`,
    },
  };

  // Truncate all blocks because API is limited to 50
  const blocks = allBlocks.length > 50 ? allBlocks.slice(0, 49).concat(remainingBlock) : allBlocks;

  const failuresObject = {
    text: `${failures.length} failures encountered running plugins tests for ${TEST_REF}`,
    blocks,
  };
  const failuresString = JSON.stringify(failuresObject);
  fs.writeFileSync(FAILURES_FILE, failuresString);
  console.log(`Wrote ${failures.length} failures out to ${FAILURES_FILE}:`);
  console.log(failuresString);
};

/**
 * Write composite test results to `RESULTS_FILE` so that they may be uploaded via trunk CLI.
 */
const writeTestResults = (testResults: TestResultSummary) => {
  const cliVersion = getTrunkVersion();
  const pluginVersion = PLUGIN_VERSION;
  const validatedVersions = Array.from(testResults.linters).reduce(
    (accumulator: ValidatedVersion[], [linter, { version, testResultStatus }]) => {
      if (testResultStatus === "passed" && version) {
        const additionalValidatedVersion: ValidatedVersion = { linter, version };
        return accumulator.concat([additionalValidatedVersion]);
      }
      return accumulator;
    },
    [],
  );
  const failures = Array.from(testResults.linters).reduce(
    (
      accumulator: FailedVersion[],
      [linter, { version, testResultStatus: status, allVersions }],
    ) => {
      if (status !== "passed" && status !== "skipped") {
        const additionalFailedVersion: FailedVersion = { linter, version, status, allVersions };
        return accumulator.concat([additionalFailedVersion]);
      }
      return accumulator;
    },
    [],
  );

  const resultsObject = {
    cliVersion,
    pluginVersion,
    validatedVersions,
  };
  const resultsString = JSON.stringify(resultsObject);
  fs.writeFileSync(RESULTS_FILE, resultsString);
  console.log(`Wrote ${validatedVersions.length} results out to ${RESULTS_FILE}:`);
  console.log(resultsString);

  if (failures.length >= 1) {
    writeFailuresForNotification(failures);
  }
};

const parseTestResultsAndWrite = () => {
  // Step 1: Parse each OS's results json file. If one of the expected files does not exist, throw and error out.
  const testResults = Object.values(TestOS).map((os) => parseResultsJson(os));
  const totalParsedTests = testResults.reduce(
    (total, testResultsSummary) => total + testResultsSummary.linters.size,
    0,
  );
  if (totalParsedTests === 0) {
    throw new Error(
      "No tests were parsed. Output files should be named {ubuntu-latest-res.json|macos-latest-res.json}",
    );
  }

  // Step 2: Merge all OS results into one composite results summary. Tests must pass with the same version on both OSs
  // in order to be recommended.
  // TODO(Tyler): Choose a minimum compliant version in the case of os-varying download versions.
  const compositeTestResult = mergeTestResultSummaries(testResults);

  // Step 3: Dump results to json file.
  writeTestResults(compositeTestResult);
};

parseTestResultsAndWrite();
