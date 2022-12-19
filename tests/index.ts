import caller from "caller";
import * as fs from "fs";
import * as path from "path";
import { SetupSettings, TestTarget, TrunkDriver } from "tests/driver";
import specific_snapshot = require("jest-specific-snapshot");
import Debug from "debug";
import { getSnapshotPath } from "tests/utils";

// trunk-ignore(eslint/@typescript-eslint/no-unused-vars): Define the matcher as extracted from dependency
const toMatchSpecificSnapshot = specific_snapshot.toMatchSpecificSnapshot;

const baseDebug = Debug("Tests");

export type TestCallback = (driver: TrunkDriver) => void;

const SNAPSHOT_DIR = "__snapshots__";

/**
 * If `namedTestPrefixes` are specified, checks for their existence in `dirname`. Otherwise,
 * automatically scan `dirname` for all available test input/output pairs.
 * @param dirname absolute path to the test subdirectory of a linter dir.
 * @param namedTestPrefixes optional prefixes of test input/output pairs.
 */
const detectTestTargets = (dirname: string, namedTestPrefixes: string[]): TestTarget[] => {
  const parentTestDirName = path.parse(dirname).name;
  // Sort guarantees basic.in comes before basic.out
  const testTargets = fs
    .readdirSync(dirname)
    .sort()
    .reduce((accumulator: Map<string, TestTarget>, file: string) => {
      // Check if this is an input file. If so, set it in the accumulator.
      const inFileRegex = /(?<prefix>.+)\.in\.(?<extension>.+)$/;
      const foundIn = file.match(inFileRegex);
      if (foundIn && foundIn.groups?.prefix) {
        const prefix = foundIn.groups?.prefix;
        if (prefix && (namedTestPrefixes.includes(prefix) || namedTestPrefixes.length === 0)) {
          const inputPath = path.join(parentTestDirName, file);
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
  preCheck: TestCallback = () => {
    // noop
  }
): TrunkDriver => {
  const driver = new TrunkDriver(dirname, { setupGit, setupTrunk, launchDaemon }, linterName);

  beforeAll(async () => {
    await driver.setUp();
    preCheck(driver);
  });

  afterAll(() => {
    driver.tearDown();
  });
  return driver;
};

/**
 * Test that running a linter filtered by `linterName` on the test files in `dirname` produces the desired output json.
 * Either detect input and ouptut files automatically, or specify their prefixes as `namedTestPrefixes`. Output files should be of
 * .json type, regardless of the input file format.
 * @param dirname absolute path to the test subdirectory in a linter folder.
 * @param linterName linter to enable and filter on.
 * @param namedTestPrefixes for input/output pair `basic.in.py`/`basic.out.json`, prefix is `basic`
 */
export const linterCheckTest = ({
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
  // Step 1: Detect test files to run
  const linterTestTargets = detectTestTargets(dirname, namedTestPrefixes);

  describe(`Testing linter ${linterName}`, () => {
    // Step 2: Define test setup and teardown
    const driver = setupDriver(dirname, {}, linterName, preCheck);

    // Step 3: Asynchronously run each test
    linterTestTargets.forEach(({ prefix, inputPath }) => {
      it(prefix, async () => {
        const debug = baseDebug.extend(driver.debugNamespace);
        const testRunResult = await driver.runCheckUnit(inputPath, linterName);
        expect(testRunResult).toMatchObject({
          success: true,
        });

        // If the linter being tested is versioned, the latest matching snapshot version will be asserted against.
        // If args.PLUGINS_TEST_NEW_SNAPSHOT is passed, a new snapshot will be created for the currently tested version.
        // If the linter is not versioned, the same snapshot will be used every time.
        // E.g. Snapshot file names may be:
        // sqlfluff_v1.4.0_basic.shot
        // sqlfluff_v1.4.3_basic.shot // versions skipped because v1.4.0 is still sufficient.
        // sqlfluff_v1.4.4_basic.shot
        // TODO(Tyler): Extend snapshot assertion to include trunk cli version.

        const snapshotDir = path.resolve(dirname, SNAPSHOT_DIR);
        const snapshotPath = getSnapshotPath(
          snapshotDir,
          linterName,
          prefix,
          driver.enabledVersion
        );
        debug("Using snapshot %s", path.basename(snapshotPath));
        expect(testRunResult.landingState).toMatchSpecificSnapshot(snapshotPath);
      });
    });
    postCheck(driver);
  });
};

/**
 * Test that running a formatter filtered by `linterName` on the test files in `dirname` produces the desired output files.
 * Either detect input and ouptut files automatically, or specify their prefixes as `namedTestPrefixes`.
 * @param dirname absolute path to the test subdirectory in a linter folder.
 * @param linterName linter to enable and filter on.
 * @param namedTestPrefixes for input/output pair `basic.in.py`/`basic.out.py`, prefix is `basic`
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
  // Step 1: Detect test files to run
  const linterTestTargets = detectTestTargets(dirname, namedTestPrefixes);

  describe(`Testing formatter ${linterName}`, () => {
    // Step 2: Define test setup and teardown
    const driver = setupDriver(dirname, {}, linterName, preCheck);

    // Step 3: Asynchronously run each test
    linterTestTargets.forEach(({ prefix, inputPath }) => {
      it(prefix, async () => {
        const testRunResult = await driver.runFmtUnit(inputPath, linterName);
        expect(testRunResult).toMatchObject({
          success: true,
        });

        const formatSnapshotPath = path.resolve(
          dirname,
          SNAPSHOT_DIR,
          `${linterName}_${prefix}_fmt.shot`
        );
        // trunk-ignore(eslint/@typescript-eslint/no-non-null-assertion)
        expect(fs.readFileSync(testRunResult.targetPath!, "utf-8")).toMatchSpecificSnapshot(
          formatSnapshotPath
        );
      });
    });
    postCheck(driver);
  });
};
