import * as fs from "fs";
import path from "path";
import {
  FailedVersion,
  FailureMode,
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
const RERUN_FILE = path.resolve(REPO_ROOT, "reruns.txt");

const RUN_ID = process.env.RUN_ID ?? "";
const TEST_REF = process.env.TEST_REF ?? "latest release";
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY ?? "missing_repo";
const PARSE_STRICTNESS = process.env.PARSE_STRICTNESS;
// If "none", don't generate failures for version mismatches.
const PLUGIN_VERSION = process.env.PLUGIN_VERSION ?? "v0.0.10";
if (!process.env.PLUGIN_VERSION) {
  console.log("Environment var `PLUGIN_VERSION` is not set, using fallback `v0.0.10`");
}
const TEST_TYPE = process.env.TEST_TYPE ?? "linter";
if (!process.env.TEST_TYPE) {
  console.log("Environment var `TEST_TYPE` is not set, using fallback `linter`");
}

/**
 * Convert an OS into the expected file path.
 */
const getResultsFileFromOS = (os: TestOS) => path.resolve(REPO_ROOT, `${os}-latest-res.json`);

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
 * Combine maps of versions run on each OS. This consolidates in order to detail mismatches.
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
 * Combines composite test statuses to compute a composite testFailureMetadata for each test fullName.
 */
const mergeTestFailureMetadata = (original: TestResult, incoming: TestResult) => {
  Array.from(incoming.testFailureMetadata).forEach(
    ([testFullName, incomingSuspectedFailureMode]) => {
      const originalSuspectedFailureMode = original.testFailureMetadata.get(testFullName);
      if (originalSuspectedFailureMode) {
        // If the incoming test result is a version mismatch, invalidate the failure mode
        if (incoming.version && original.version && incoming.version !== original.version) {
          original.testFailureMetadata.set(testFullName, "unknown");
          return;
        }

        // If the incoming test result is a pass, invalidate the failure mode
        if (incoming.testResultStatus === "passed") {
          original.testFailureMetadata.set(testFullName, "passed");
          return;
        }

        // If the incoming test result is a skipped, use the current failure mode
        if (incoming.testResultStatus === "skipped") {
          return;
        }

        // If the incoming test result is a failure and not assertion_failure, invalidate the failure mode
        if (incomingSuspectedFailureMode !== "assertion_failure") {
          original.testFailureMetadata.set(testFullName, incomingSuspectedFailureMode);
          return;
        }

        // Otherwise, we are clear to assume that this is accurately an assertion_failure
      } else {
        original.testFailureMetadata.set(testFullName, incomingSuspectedFailureMode);
      }
    },
  );
};

/**
 * Merge the result of multiple tests into one. Concatenates test names, intelligently merges statuses,
 * and handles version mismatches.
 */
const mergeTestResults = (original: TestResult, incoming: TestResult) => {
  // Merge existing composite records
  const { version, testResultStatus } = incoming;
  // Handle testFailureMetadata. Must occur before testResultStatus is merged.
  mergeTestFailureMetadata(original, incoming);

  // Handle TestResult information
  if (version && original.version && version !== original.version && PARSE_STRICTNESS !== "none") {
    original.testResultStatus = "mismatch";
    mergeTestVersions(original, incoming);
  } else {
    original.testResultStatus = mergeTestStatuses(original.testResultStatus, testResultStatus);
  }
  if (original.testResultStatus == "failed") {
    original.failedPlatforms = new Set([...original.failedPlatforms, ...incoming.failedPlatforms]);
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
    // The caller is primarily responsible for reporting if a file is missing.
    console.warn(`Failed to parse ${resultsJsonPath}. Skipping`);
    return {
      os,
      testResults: linterResults,
    };
  }

  // trunk-ignore-begin(eslint/@typescript-eslint/no-unsafe-call)
  jsonResult.testResults.forEach((testResult: any) => {
    // NOTE(Tyler): Jest does their own file path transformation that sometimes interferes with GH runners.
    // Use this naive replacement in order to divine the relative path to the test file.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const testFilePath = (testResult.name as string).replace(/.*linters/, "linters").toString();

    testResult.assertionResults.forEach((assertionResult: any) => {
      const testName: string = assertionResult.ancestorTitles[0];
      const foundLinterName = testName.match(/Testing (linter|formatter|tool) (?<linter>.+)/);
      const linterName = foundLinterName?.groups?.linter;
      if (!linterName) {
        console.warn(`Failed to parse test name from ${testName}`);
        return;
      }

      const fullTestName: string = assertionResult.fullName;
      const testType = assertionResult.testType;
      if (testType && testType !== TEST_TYPE) {
        console.warn(`Skipping test '${fullTestName}' because is type '${testType}'`);
        return;
      }

      const version: string = assertionResult.version;
      const suspectedFailureMode: FailureMode = assertionResult.suspectedFailureMode ?? "unknown";
      const status = parseTestStatus(assertionResult.status);
      const failedPlatforms = new Set<TestOS>();
      if (status === "failed") {
        failedPlatforms.add(os);
      }

      const originaltestResult = linterResults.get(linterName);
      const newResultAllVersions = new Map();
      newResultAllVersions.set(os, new Set([version]));
      const newTestResult = {
        version,
        testFailureMetadata: new Map<string, FailureMode>([[fullTestName, suspectedFailureMode]]),
        testResultStatus: status,
        allVersions: newResultAllVersions,
        failedPlatforms,
        testFilePath,
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
    testResults: linterResults,
  };
};

/**
 * Merge the result summaries of multiple OS tests. Merges serially such that all tests for a linter must have the
 * same version and all tests must be skipped or pass to be considered passed.
 */
const mergeTestResultSummaries = (testResults: TestResultSummary[]): TestResultSummary => {
  const compositeLinterResults = testResults[0].testResults;

  // Merge all other OS results into the first OS's results
  testResults.slice(1).forEach((testResult) => {
    testResult.testResults.forEach((linterResult, linterName) => {
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
    testResults: compositeLinterResults,
  };
};

/**
 * Write the payload for a slack notification on test failures.
 */
const writeFailuresForNotification = (failures: FailedVersion[]) => {
  const allBlocks = failures.map(
    ({ linter, version, status, allVersions, failedPlatforms, rerunningTest }) => {
      const linterVersion = version ? `${linter}@${version}` : linter;
      let details = "";
      if (status == "mismatch") {
        details = `(${Array.from(allVersions)
          .map(([os, versions]) => `${os}: ${Array.from(versions).join(", ")}`)
          .join("; ")})`;
      } else if (status == "failed") {
        details = `(${Array.from(failedPlatforms.keys())
          .map((os) => os.toString())
          .join(", ")})`;
        if (rerunningTest) {
          details = details.concat(" _(rerunning)_");
        }
      }
      return {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${TEST_REF} Test Failure: <https://github.com/${GITHUB_REPOSITORY}/actions/runs/${RUN_ID}| Testing latest ${TEST_TYPE} ${linterVersion} > _STATUS: ${status}_ ${details}`,
        },
      };
    },
  );

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
 * Write the payload for which tests to rerun
 */
const writeRerunTests = (rerunPaths: string[]) => {
  const rerunString = rerunPaths.join(" ");
  fs.writeFileSync(RERUN_FILE, rerunString);
  console.log(`Wrote ${rerunString} reruns out to ${RERUN_FILE}`);
};

/**
 * Write composite test results to `RESULTS_FILE` so that they may be uploaded via trunk CLI.
 */
const writeTestResults = (testResults: TestResultSummary) => {
  const cliVersion = getTrunkVersion();
  const pluginVersion = PLUGIN_VERSION;
  const validatedVersions = Array.from(testResults.testResults).reduce(
    (accumulator: ValidatedVersion[], [linter, { version, testResultStatus }]) => {
      if (testResultStatus === "passed" && version) {
        const additionalValidatedVersion: ValidatedVersion = { linter, version };
        return accumulator.concat([additionalValidatedVersion]);
      }
      return accumulator;
    },
    [],
  );
  const rerunPaths: string[] = [];
  const failures: FailedVersion[] = [];
  Array.from(testResults.testResults).forEach(
    ([
      linter,
      {
        version,
        testFailureMetadata,
        testResultStatus: status,
        allVersions,
        failedPlatforms,
        testFilePath,
      },
    ]) => {
      if (status !== "passed" && status !== "skipped") {
        const allMetadata = Array.from(testFailureMetadata.values());
        // Must have at least one assertion_failure and no other failure types in order to proactively generate snapshot.
        const shouldRerunTest =
          allMetadata.every(
            (failureMode) =>
              failureMode === "assertion_failure" ||
              failureMode === "skipped" ||
              failureMode === "passed",
          ) && allMetadata.find((failureMode) => failureMode === "assertion_failure") !== undefined;
        if (shouldRerunTest) {
          rerunPaths.push(testFilePath);
        }

        const additionalFailedVersion: FailedVersion = {
          linter,
          version,
          status,
          allVersions,
          failedPlatforms,
          rerunningTest: shouldRerunTest,
        };
        failures.push(additionalFailedVersion);
      }
    },
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
  if (rerunPaths.length >= 1) {
    writeRerunTests(rerunPaths);
  }
};

const parseTestResultsAndWrite = () => {
  // Step 1: Parse each OS's results json file. If one of the expected files does not exist, throw and error out.
  const testResults = Object.values(TestOS).map((os) => parseResultsJson(os));
  const totalParsedTests = testResults.reduce(
    (total, testResultsSummary) => total + testResultsSummary.testResults.size,
    0,
  );
  if (totalParsedTests === 0) {
    throw new Error(
      "No tests were parsed. Output files should be named {ubuntu-latest-res.json|macos-latest-res.json|windows-latest-res.json}",
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
