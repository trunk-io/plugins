import caller from "caller";
import * as fs from "fs";
import * as path from "path";
import { SetupSettings, TestTarget, TrunkLintDriver, TrunkToolDriver } from "tests/driver";
import { FileIssue, LandingState } from "tests/types";

import specific_snapshot = require("jest-specific-snapshot");
import Debug from "debug";
import {
  getSnapshotPathForAssert,
  getVersionsForTest,
  landingStateWrapper,
  TEST_DATA,
} from "tests/utils";

// trunk-ignore(eslint/@typescript-eslint/no-unused-vars): Define the matcher as extracted from dependency
const toMatchSpecificSnapshot = specific_snapshot.toMatchSpecificSnapshot;

// The underlying implementation of jest-specific-snapshot supports forwarding additional arguments from
// `toMatchSpecificSnapshot` and appending them to `toMatchSnapshot`, but its type declarations do not explicitly
// support this. Adding this patch/override allows us to call it with custom matchers, as in the case of `landingStateWrapper`.
type OwnMatcher<Params extends unknown[]> = (
  this: jest.MatcherContext,
  actual: unknown,
  ...params: Params
) => jest.CustomMatcherResult;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toMatchSpecificSnapshot(snapshotFilename: string, customMatcher: unknown): R;
      toHaveIssueOverlap(expected: FileIssue[], minimumOverlap: number): R;
    }
    interface ExpectExtendMap {
      toHaveIssueOverlap: OwnMatcher<[expected: FileIssue[], minimumOverlap: number]>;
    }
  }
}

const registerVersion = (linterVersion?: string) => {
  // @ts-expect-error: `_buffer` is `private`, see `tests/reporter/reporters.ts` for rationale
  // trunk-ignore(eslint): Manual patch is quired here for most reliable implementation
  console._buffer?.push({
    message: linterVersion,
    origin: expect.getState().currentTestName,
    type: "linter-version",
  });
};

const baseDebug = Debug("Tests");

const CUSTOM_SNAPSHOT_PREFIX = "CUSTOM";

const conditionalTest = (
  skipTest: boolean,
  name: string,
  fn?: jest.ProvidesCallback | undefined,
  timeout?: number | undefined,
) => (skipTest ? it.skip(name, fn, timeout) : it(name, fn, timeout));

export type TestCallback = (driver: TrunkLintDriver) => unknown;
export type ToolTestCallback = (driver: TrunkToolDriver) => unknown;

/**
 * If `namedTestPrefixes` are specified, checks for their existence in `dirname`/test_data. Otherwise,
 * automatically scan `dirname` for all available test inputs.
 * @param dirname absolute path to the linter subdir.
 * @param namedTestPrefixes optional prefixes of test inputs.
 */
const detectTestTargets = (dirname: string, namedTestPrefixes: string[]): TestTarget[] => {
  const testDataDir = path.resolve(dirname, TEST_DATA);
  const testTargets = fs
    .readdirSync(testDataDir)
    .sort()
    .reduce((accumulator: Map<string, TestTarget>, file: string) => {
      // Check if this is an input file. If so, set it in the accumulator.
      const inFileRegex = /(?<prefix>.+)\.in\.(?<extension>.+)$/;
      const foundIn = file.match(inFileRegex);
      const prefix = foundIn?.groups?.prefix;
      if (foundIn && prefix) {
        if (prefix && (namedTestPrefixes.includes(prefix) || namedTestPrefixes.length === 0)) {
          // inputPath is intentionally a relative path
          const inputPath = path.join(TEST_DATA, file);
          accumulator.set(prefix, { prefix, inputPath });
          return accumulator;
        }
      }
      return accumulator;
    }, new Map<string, TestTarget>());

  return [...testTargets.values()];
};

/**
 * Setup the TrunkLintDriver to run tests in a `dirname`.
 * @param dirname absolute path to the test subdirectory in a linter folder.
 * @param setupSettings configuration for the driver's repo setup. setupGit and setupTrunk default to true.
 * @param linterName if specified, enables this linter during setup.
 * @param version the version of a linter to enable, if specified. May be a version string or one of `LinterVersion`
 */
export const setupDriver = (
  dirname: string,
  { setupGit = true, setupTrunk = true, trunkVersion = undefined }: SetupSettings,
  linterName?: string,
  version?: string,
  preCheck?: TestCallback,
): TrunkLintDriver => {
  const driver = new TrunkLintDriver(
    dirname,
    { setupGit, setupTrunk, trunkVersion },
    linterName,
    version,
  );

  beforeAll(async () => {
    await driver.setUp();
    if (preCheck) {
      // preCheck is not always async, but we must await in case it is.
      await preCheck(driver);
      driver.debug("Finished running custom preCheck hook");
    }
  });

  afterAll(() => {
    driver.tearDown();
  });

  afterEach(() => {
    registerVersion(driver.enabledVersion);
  });
  return driver;
};

export const setupTrunkToolDriver = (
  dirname: string,
  { setupGit = true, setupTrunk = true, trunkVersion = undefined }: SetupSettings,
  toolName?: string,
  version?: string,
  preCheck?: ToolTestCallback,
): TrunkToolDriver => {
  const driver = new TrunkToolDriver(
    dirname,
    { setupGit, setupTrunk, trunkVersion },
    toolName,
    version,
  );

  beforeAll(async () => {
    if (preCheck) {
      // preCheck is not always async, but we must await in case it is.
      await preCheck(driver);
      driver.debug("Finished running custom preCheck hook");
    }
    await driver.setUp();
  });

  afterAll(() => {
    driver.tearDown();
  });
  return driver;
};

interface ToolTestConfig {
  command: string[];
  expectedOut?: string;
  expectedErr?: string;
  expectedExitCode?: number;
}

export const makeToolTestConfig = ({
  command,
  expectedOut = "",
  expectedErr = "",
  expectedExitCode = 0,
}: ToolTestConfig) => ({
  command,
  expectedOut,
  expectedErr,
  expectedExitCode,
});

export const toolTest = ({
  toolName,
  toolVersion,
  testConfigs,
  dirName = path.dirname(caller()),
  skipTestIf = (_version?: string) => false,
  preCheck,
}: {
  toolName: string;
  toolVersion: string;
  dirName?: string;
  testConfigs: ToolTestConfig[];
  skipTestIf?: (version?: string) => boolean;
  preCheck?: ToolTestCallback;
}) => {
  describe(toolName, () => {
    const driver = setupTrunkToolDriver(dirName, {}, toolName, toolVersion, preCheck);
    testConfigs.forEach(({ command, expectedOut, expectedErr, expectedExitCode }) => {
      conditionalTest(skipTestIf(toolVersion), command.join(" "), async () => {
        const { stdout, stderr, exitCode } = await driver.runTool(command);
        expect(stdout).toContain(expectedOut);
        expect(stderr).toContain(expectedErr);
        expect(exitCode).toEqual(expectedExitCode);
      });
    });
  });
};

// TODO(Tyler): Add additional assertion options to the custom checks, including checking failures, etc.
// TODO(Tyler): Add additional options to the custom checks, including OS and CI-specific runs.
/**
 * Test that running a linter filtered by `linterName` with any custom `args` produces the desired output
 * json. Optionally specify additional file paths to snapshot.
 * Prefer using `linterCheckTest` unless additional specification is needed.
 * @param dirname absolute path to the linter subdirectory.
 * @param testName name to uniquely identify a test run/snapshot (default CUSTOM).
 * @param linterName linter to enable and filter on.
 * @param args args to append to the `trunk check` call (e.g. file paths, flags, etc.)
 * @param pathsToSnapshot file paths that should be used to generate snapshots, such as for when passing `-y` as an arg.
 *                        Paths should be relative to the specific linter subdirectory (or relative to the sandbox root).
 * @param versionGreaterThanOrEqual custom gte comparator for use with non-semver linters.
 *                                  Custom versions must not include underscores.
 * @param skipTestIf callback to check if test should be skipped or run.
 *                   Takes in the test's linter version (from snapshots).
 * @param preCheck callback to run during setup
 * @param postCheck callback to run for additional assertions from the base snapshot
 */
export const customLinterCheckTest = ({
  linterName,
  testName = CUSTOM_SNAPSHOT_PREFIX,
  dirname = path.dirname(caller()),
  args = "",
  pathsToSnapshot = [],
  versionGreaterThanOrEqual,
  skipTestIf = (_version?: string) => false,
  preCheck,
  postCheck,
  normalizeLandingState,
}: {
  linterName: string;
  testName?: string;
  dirname?: string;
  args?: string;
  pathsToSnapshot?: string[];
  versionGreaterThanOrEqual?: (_a: string, _b: string) => boolean;
  skipTestIf?: (version?: string) => boolean;
  preCheck?: TestCallback;
  postCheck?: TestCallback;
  normalizeLandingState?: (landingState: LandingState) => void;
}) => {
  describe(`Testing linter ${linterName}`, () => {
    // Step 1: Detect versions to test against if PLUGINS_TEST_LINTER_VERSION=Snapshots
    const linterVersions = getVersionsForTest(dirname, linterName, testName, "check");
    linterVersions.forEach((linterVersion) => {
      // TODO(Tyler): Find a reliable way to replace the name "test" with version that doesn't violate snapshot export names.
      describe("test", () => {
        // Step 2: Define test setup and teardown
        const driver = setupDriver(dirname, {}, linterName, linterVersion, preCheck);

        // Step 3: Run the test
        conditionalTest(skipTestIf(linterVersion), testName, async () => {
          const debug = baseDebug.extend(driver.debugNamespace);

          const testRunResult = await driver.runCheck({ args, linter: linterName });
          expect(testRunResult).toMatchObject({
            success: true,
          });

          // Allow the user to normalize the landing state before snapshotting.
          if (normalizeLandingState && testRunResult.landingState) {
            normalizeLandingState(testRunResult.landingState);
          }

          // Step 4a: Verify that the output matches expected snapshots for that linter version.
          // See `getSnapshotPathForAssert` and `linterCheckTest` for explanation of snapshot logic.
          const snapshotDir = path.resolve(dirname, TEST_DATA);
          const primarySnapshotPath = getSnapshotPathForAssert(
            snapshotDir,
            linterName,
            testName,
            "check",
            driver.enabledVersion,
            versionGreaterThanOrEqual,
          );
          debug(
            "Using snapshot (for dir: %s, linter: %s, version: %s) %s",
            snapshotDir,
            linterName,
            driver.enabledVersion ?? "no version",
            primarySnapshotPath,
          );
          expect(testRunResult.landingState).toMatchSpecificSnapshot(
            primarySnapshotPath,
            landingStateWrapper(testRunResult.landingState, primarySnapshotPath),
          );

          // Step 4b: Verify that any specified files match their expected snapshots for that linter version.
          pathsToSnapshot.forEach((pathToSnapshot) => {
            const normalizedName = pathToSnapshot.replaceAll("/", ".").replaceAll("\\", ".");
            const snapshotPath = getSnapshotPathForAssert(
              snapshotDir,
              linterName,
              normalizedName,
              "check",
              driver.enabledVersion,
              versionGreaterThanOrEqual,
            );
            debug(
              "Using snapshot (for dir: %s, linter: %s, version: %s) %s",
              snapshotDir,
              linterName,
              driver.enabledVersion ?? "no version",
              snapshotPath,
            );
            expect(driver.readFile(pathToSnapshot)).toMatchSpecificSnapshot(snapshotPath);
          });

          if (postCheck) {
            postCheck(driver);
            driver.debug("Finished running custom postCheck hook");
          }
        });
      });
    });
  });
};

/**
 * Test that running a linter filtered by `linterName` with any custom `args` produces the desired output
 * json. Optionally specify additional file paths to snapshot.
 * Prefer using `linterFmtTest` unless additional specification is needed.
 * @param dirname absolute path to the linter subdirectory.
 * @param testName name to uniquely identify a test run/snapshot (default CUSTOM).
 * @param linterName linter to enable and filter on.
 * @param args args to append to the `trunk fmt` call (e.g. file paths, flags, etc.)
 * @param pathsToSnapshot file paths that should be used to generate snapshots, such as for when passing `-y` as an arg.
 *                        Paths should be relative to the specific linter subdirectory (or relative to the sandbox root).
 * @param versionGreaterThanOrEqual custom gte comparator for use with non-semver linters.
 *                                  Custom versions must not include underscores.
 * @param skipTestIf callback to check if test should be skipped or run.
 *                   Takes in the test's linter version (from snapshots).
 * @param preCheck callback to run during setup
 * @param postCheck callback to run for additional assertions from the base snapshot
 */
export const customLinterFmtTest = ({
  linterName,
  testName = CUSTOM_SNAPSHOT_PREFIX,
  dirname = path.dirname(caller()),
  args = "",
  pathsToSnapshot = [],
  versionGreaterThanOrEqual,
  skipTestIf = (_version?: string) => false,
  preCheck,
  postCheck,
}: {
  linterName: string;
  testName?: string;
  dirname?: string;
  args?: string;
  pathsToSnapshot?: string[];
  versionGreaterThanOrEqual?: (_a: string, _b: string) => boolean;
  skipTestIf?: (version?: string) => boolean;
  preCheck?: TestCallback;
  postCheck?: TestCallback;
}) => {
  describe(`Testing formatter ${linterName}`, () => {
    // Step 1: Detect versions to test against if PLUGINS_TEST_LINTER_VERSION=Snapshots
    const linterVersions = getVersionsForTest(dirname, linterName, `${testName}.*`, "fmt");
    linterVersions.forEach((linterVersion) => {
      // TODO(Tyler): Find a reliable way to replace the name "test" with version that doesn't violate snapshot export names.
      describe("test", () => {
        // Step 2: Define test setup and teardown
        const driver = setupDriver(dirname, {}, linterName, linterVersion, preCheck);

        // Step 3: Run the test
        conditionalTest(skipTestIf(linterVersion), testName, async () => {
          const debug = baseDebug.extend(driver.debugNamespace);

          const testRunResult = await driver.runFmt({ args, linter: linterName });
          expect(testRunResult).toMatchObject({
            success: true,
            landingState: {
              taskFailures: [],
            },
          });

          // Step 4: Verify that any specified files match their expected snapshots for that linter version.
          const snapshotDir = path.resolve(dirname, TEST_DATA);
          pathsToSnapshot.forEach((pathToSnapshot) => {
            const normalizedName = `${testName}.${pathToSnapshot
              .replaceAll("/", ".")
              .replaceAll("\\", ".")}`;
            const snapshotPath = getSnapshotPathForAssert(
              snapshotDir,
              linterName,
              normalizedName,
              "fmt",
              driver.enabledVersion,
              versionGreaterThanOrEqual,
            );
            debug(
              "Using snapshot (for dir: %s, linter: %s, version: %s) %s",
              snapshotDir,
              linterName,
              driver.enabledVersion ?? "no version",
              snapshotPath,
            );
            expect(driver.readFile(pathToSnapshot)).toMatchSpecificSnapshot(snapshotPath);
          });

          if (postCheck) {
            postCheck(driver);
            driver.debug("Finished running custom postCheck hook");
          }
        });
      });
    });
  });
};

/**
 * ONLY for use with linters that are non-idempotent and tend to vary in their output frequently (e.g. osv-scanner).
 * Test that running a linter filtered by `linterName` with any custom `args` produces the desired output
 * json. The landing state is stripped of its fileIssues, which are compared against an input matcher.
 *
 * Prefer using `linterCheckTest` unless additional specification is needed.
 * @param dirname absolute path to the linter subdirectory.
 * @param testName name to uniquely identify a test run/snapshot (default CUSTOM).
 * @param linterName linter to enable and filter on.
 * @param args args to append to the `trunk check` call (e.g. file paths, flags, etc.)
 * @param fileIssueAssertionCallback callback that asserts the correctness of the landing state's file issues.
 * @param versionGreaterThanOrEqual custom gte comparator for use with non-semver linters.
 *                                  Custom versions must not include underscores.
 * @param skipTestIf callback to check if test should be skipped or run.
 *                   Takes in the test's linter version (from snapshots).
 * @param preCheck callback to run during setup
 * @param postCheck callback to run for additional assertions from the base snapshot
 */
export const fuzzyLinterCheckTest = ({
  linterName,
  testName = CUSTOM_SNAPSHOT_PREFIX,
  dirname = path.dirname(caller()),
  args = "",
  fileIssueAssertionCallback,
  versionGreaterThanOrEqual,
  skipTestIf = (_version?: string) => false,
  preCheck,
  postCheck,
}: {
  linterName: string;
  testName?: string;
  dirname?: string;
  args?: string;
  fileIssueAssertionCallback: (fileIssues: FileIssue[], version?: string) => void;
  pathsToSnapshot?: string[];
  versionGreaterThanOrEqual?: (_a: string, _b: string) => boolean;
  skipTestIf?: (version?: string) => boolean;
  preCheck?: TestCallback;
  postCheck?: TestCallback;
}) => {
  describe(`Testing linter ${linterName}`, () => {
    // Step 1: Detect versions to test against if PLUGINS_TEST_LINTER_VERSION=Snapshots
    const linterVersions = getVersionsForTest(dirname, linterName, testName, "check");
    linterVersions.forEach((linterVersion) => {
      // TODO(Tyler): Find a reliable way to replace the name "test" with version that doesn't violate snapshot export names.
      describe("test", () => {
        // Step 2: Define test setup and teardown
        const driver = setupDriver(dirname, {}, linterName, linterVersion, preCheck);

        // Step 3: Run the test
        conditionalTest(skipTestIf(linterVersion), testName, async () => {
          const debug = baseDebug.extend(driver.debugNamespace);

          const testRunResult = await driver.runCheck({ args, linter: linterName });
          expect(testRunResult).toMatchObject({
            success: true,
          });

          // Step 4a: Verify that the output matches expected snapshots for that linter version.
          // See `getSnapshotPathForAssert` and `linterCheckTest` for explanation of snapshot logic.
          // Strip fileIssues from snapshot as they are non-idempotent and flaky.
          const strippedLandingState = { ...testRunResult.landingState, issues: [] };
          const snapshotDir = path.resolve(dirname, TEST_DATA);
          const primarySnapshotPath = getSnapshotPathForAssert(
            snapshotDir,
            linterName,
            testName,
            "check",
            driver.enabledVersion,
            versionGreaterThanOrEqual,
          );
          debug(
            "Using snapshot (for dir: %s, linter: %s, version: %s) %s",
            snapshotDir,
            linterName,
            driver.enabledVersion ?? "no version",
            primarySnapshotPath,
          );
          expect(strippedLandingState).toMatchSpecificSnapshot(
            primarySnapshotPath,
            landingStateWrapper(strippedLandingState, primarySnapshotPath),
          );

          // Step 4b: Verify that the fileIssues pass the assertion callback.
          debug("Checking against assertion callback");
          fileIssueAssertionCallback(
            testRunResult.landingState?.issues ?? [],
            driver.enabledVersion,
          );

          if (postCheck) {
            postCheck(driver);
            driver.debug("Finished running custom postCheck hook");
          }
        });
      });
    });
  });
};

/**
 * Test that running a linter filtered by `linterName` on the test files in test_data in `dirname` produces the desired output
 * json. Either detect input files automatically, or specify their prefixes as `namedTestPrefixes`.
 * @param dirname absolute path to the linter subdirectory.
 * @param linterName linter to enable and filter on.
 * @param namedTestPrefixes for input `test_data/basic.in.py`, prefix is `basic`
 * @param skipTestIf callback to check if test should be skipped or run.
 *                   Takes in the test's linter version (from snapshots).
 * @param preCheck callback to run during setup
 * @param postCheck callback to run for additional assertions from the base snapshot
 */
export const linterCheckTest = ({
  linterName,
  dirname = path.dirname(caller()),
  namedTestPrefixes = [],
  skipTestIf = (_version?: string) => false,
  preCheck,
  postCheck,
}: {
  linterName: string;
  dirname?: string;
  namedTestPrefixes?: string[];
  skipTestIf?: (version?: string) => boolean;
  preCheck?: TestCallback;
  postCheck?: TestCallback;
}) => {
  // Step 1a: Detect test files to run
  const linterTestTargets = detectTestTargets(dirname, namedTestPrefixes);

  describe(`Testing linter ${linterName}`, () => {
    linterTestTargets.forEach(({ prefix, inputPath }) => {
      // Step 1b: Detect versions to test against if PLUGINS_TEST_LINTER_VERSION=Snapshots
      const linterVersions = getVersionsForTest(dirname, linterName, prefix, "check");
      linterVersions.forEach((linterVersion) => {
        // TODO(Tyler): Find a reliable way to replace the name "test" with version that doesn't violate snapshot export names.
        describe("test", () => {
          // Step 2: Define test setup and teardown
          const driver = setupDriver(dirname, {}, linterName, linterVersion, preCheck);

          // Step 3: Run each test
          conditionalTest(skipTestIf(linterVersion), prefix, async () => {
            const debug = baseDebug.extend(driver.debugNamespace);
            const testRunResult = await driver.runCheckUnit(inputPath, linterName);
            expect(testRunResult).toMatchObject({
              success: true,
            });

            // Step 4: Verify that the output matches expected snapshots for that linter version.
            // If the linter being tested is versioned, the latest matching snapshot version will be asserted against.
            // If args.PLUGINS_TEST_UPDATE_SNAPSHOTS is passed, a new snapshot will be created for the currently tested version.
            // If the linter is not versioned, the same snapshot will be used every time.
            // E.g. Snapshot file names may be:
            // sqlfluff_v1.4.0_basic.check.shot
            // sqlfluff_v1.4.3_basic.check.shot // versions skipped because v1.4.0 is still sufficient.
            // sqlfluff_v1.4.4_basic.check.shot
            // TODO(Tyler): We may want to extend snapshot assertion to include trunk cli version.
            const snapshotDir = path.resolve(dirname, TEST_DATA);
            const snapshotPath = getSnapshotPathForAssert(
              snapshotDir,
              linterName,
              prefix,
              "check",
              driver.enabledVersion,
            );
            debug(
              "Using snapshot (for dir: %s, linter: %s, version: %s) %s",
              snapshotDir,
              linterName,
              driver.enabledVersion ?? "no version",
              snapshotPath,
            );
            expect(testRunResult.landingState).toMatchSpecificSnapshot(
              snapshotPath,
              landingStateWrapper(testRunResult.landingState, snapshotPath),
            );

            if (postCheck) {
              postCheck(driver);
              driver.debug("Finished running custom postCheck hook");
            }
          });
        });
      });
    });
  });
};

/**
 * Test that running a formatter filtered by `linterName` on the test files in `dirname` produces the desired output files.
 * Either detect input files automatically, or specify their prefixes as `namedTestPrefixes`.
 * @param dirname absolute path to the linter subdir.
 * @param linterName linter to enable and filter on.
 * @param namedTestPrefixes for input pair `test_data/basic.in.py`, prefix is `basic`
 * @param skipTestIf callback to check if test should be skipped or run.
 *                   Takes in the test's linter version (from snapshots).
 * @param preCheck callback to run during setup
 * @param postCheck callback to run for additional assertions from the base snapshot
 */
export const linterFmtTest = ({
  linterName,
  dirname = path.dirname(caller()),
  namedTestPrefixes = [],
  skipTestIf = (_version?: string) => false,
  preCheck,
  postCheck,
}: {
  linterName: string;
  dirname?: string;
  namedTestPrefixes?: string[];
  skipTestIf?: (version?: string) => boolean;
  preCheck?: TestCallback;
  postCheck?: TestCallback;
}) => {
  // Step 1a: Detect test files to run and versions for asserts.
  const linterTestTargets = detectTestTargets(dirname, namedTestPrefixes);

  describe(`Testing formatter ${linterName}`, () => {
    linterTestTargets.forEach(({ prefix, inputPath }) => {
      // Step 1b: Detect versions to test against if PLUGINS_TEST_LINTER_VERSION=Snapshots
      const linterVersions = getVersionsForTest(dirname, linterName, prefix, "fmt");
      linterVersions.forEach((linterVersion) => {
        // TODO(Tyler): Find a reliable way to replace the name "test" with version that doesn't violate snapshot export names.
        describe("test", () => {
          // Step 2: Define test setup and teardown
          const driver = setupDriver(dirname, {}, linterName, linterVersion, preCheck);

          // Step 3: Run each test
          conditionalTest(skipTestIf(linterVersion), prefix, async () => {
            const debug = baseDebug.extend(driver.debugNamespace);
            const testRunResult = await driver.runFmtUnit(inputPath, linterName);

            expect(testRunResult).toMatchObject({
              success: true,
              landingState: {
                taskFailures: [],
              },
            });

            // Step 4: Verify that the output matches expected snapshots for that linter version.
            // See `getSnapshotPathForAssert` and `linterCheckTest` for explanation of snapshot logic.
            const snapshotDir = path.resolve(dirname, TEST_DATA);
            const snapshotPath = getSnapshotPathForAssert(
              snapshotDir,
              linterName,
              prefix,
              "fmt",
              driver.enabledVersion,
            );
            debug(
              "Using snapshot (for dir: %s, linter: %s, version: %s) %s",
              snapshotDir,
              linterName,
              driver.enabledVersion ?? "no version",
              snapshotPath,
            );
            // trunk-ignore(eslint/@typescript-eslint/no-non-null-assertion)
            expect(fs.readFileSync(testRunResult.targetPath!, "utf-8")).toMatchSpecificSnapshot(
              snapshotPath,
            );

            if (postCheck) {
              postCheck(driver);
              driver.debug("Finished running custom postCheck hook");
            }
          });
        });
      });
    });
  });
};
