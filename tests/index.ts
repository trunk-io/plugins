import caller from "caller";
import * as fs from "fs";
import * as path from "path";
import { SetupSettings, TestTarget, TrunkDriver } from "tests/driver";
import specific_snapshot = require("jest-specific-snapshot");
import Debug from "debug";
import { getSnapshotPathForAssert, getVersionsForTest, TEST_DATA } from "tests/utils";

// trunk-ignore(eslint/@typescript-eslint/no-unused-vars): Define the matcher as extracted from dependency
const toMatchSpecificSnapshot = specific_snapshot.toMatchSpecificSnapshot;

const baseDebug = Debug("Tests");

export type TestCallback = (driver: TrunkDriver) => unknown;

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
 * Setup the TrunkDriver to run tests in a `dirname`.
 * @param dirname absolute path to the test subdirectory in a linter folder.
 * @param setupSettings configuration for the driver's repo setup. setupGit and setupTrunk default to true.
 * @param linterName if specified, enables this linter during setup.
 */
export const setupDriver = (
  dirname: string,
  { setupGit = true, setupTrunk = true, launchDaemon = true }: SetupSettings,
  linterName?: string,
  version?: string,
  preCheck?: TestCallback
): TrunkDriver => {
  const driver = new TrunkDriver(
    dirname,
    { setupGit, setupTrunk, launchDaemon },
    linterName,
    version
  );

  beforeEach(async () => {
    await driver.setUp();
    if (preCheck) {
      // preCheck is not always async, but we must await in case it is.
      await preCheck(driver);
      driver.debug("Finished running custom preCheck hook");
    }
  });

  afterEach(() => {
    driver.tearDown();
  });
  return driver;
};

/**
 * Test that running a linter filtered by `linterName` on the test files in test_data in `dirname` produces the desired output
 * json. Either detect input files automatically, or specify their prefixes as `namedTestPrefixes`.
 * @param dirname absolute path to the linter subdirectory.
 * @param linterName linter to enable and filter on.
 * @param namedTestPrefixes for input `test_data/basic.in.py`, prefix is `basic`
 */
export const linterCheckTest = ({
  linterName,
  dirname = path.dirname(caller()),
  namedTestPrefixes = [],
  preCheck,
  postCheck,
}: {
  linterName: string;
  dirname?: string;
  namedTestPrefixes?: string[];
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
        // TODO(Tyler): Find a reliable way to replace the name "test" that doesn't violate snapshot export names.
        describe("test", () => {
          // Step 2: Define test setup and teardown
          const driver = setupDriver(dirname, {}, linterName, linterVersion, preCheck);

          // Step 3: Run each test
          it(prefix, async () => {
            const debug = baseDebug.extend(driver.debugNamespace);
            const testRunResult = await driver.runCheckUnit(inputPath, linterName);
            expect(testRunResult).toMatchObject({
              success: true,
            });

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
              driver.enabledVersion
            );
            debug("Using snapshot %s", path.basename(snapshotPath));
            expect(testRunResult.landingState).toMatchSpecificSnapshot(snapshotPath);
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
 * Test that running a formatter filtered by `linterName` on the test files in `dirname` produces the desired output files.
 * Either detect input files automatically, or specify their prefixes as `namedTestPrefixes`.
 * @param dirname absolute path to the linter subdir.
 * @param linterName linter to enable and filter on.
 * @param namedTestPrefixes for input pair `test_data/basic.in.py`, prefix is `basic`
 */
export const linterFmtTest = ({
  linterName,
  dirname = path.dirname(caller()),
  namedTestPrefixes = [],
  preCheck = () => {
    // noop
  },
  postCheck = () => {
    // noop
  },
}: {
  linterName: string;
  dirname?: string;
  namedTestPrefixes?: string[];
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
        // TODO(Tyler): Find a reliable way to replace the name "test" that doesn't violate snapshot export names.
        describe("test", () => {
          // Step 2: Define test setup and teardown
          const driver = setupDriver(dirname, {}, linterName, linterVersion, preCheck);

          // Step 3: Run each test
          it(prefix, async () => {
            const debug = baseDebug.extend(driver.debugNamespace);
            const testRunResult = await driver.runFmtUnit(inputPath, linterName);
            expect(testRunResult).toMatchObject({
              success: true,
              landingState: {
                taskFailures: [],
              },
            });

            const snapshotDir = path.resolve(dirname, TEST_DATA);
            const snapshotPath = getSnapshotPathForAssert(
              snapshotDir,
              linterName,
              prefix,
              "fmt",
              driver.enabledVersion
            );
            debug("Using snapshot %s", path.basename(snapshotPath));
            // trunk-ignore(eslint/@typescript-eslint/no-non-null-assertion)
            expect(fs.readFileSync(testRunResult.targetPath!, "utf-8")).toMatchSpecificSnapshot(
              snapshotPath
            );
          });
          postCheck(driver);
        });
      });
    });
  });
};
