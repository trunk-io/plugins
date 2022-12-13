import caller from "caller";
import * as fs from "fs";
import * as path from "path";
import { SetupSettings, TestTarget, TrunkDriver } from "tests/driver";
import { extractLandingState } from "tests/utils/landing_state";

export type TestCallback = (driver: TrunkDriver) => void;

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
          accumulator.set(prefix, { prefix, inputPath, outputPath: "" });
          return accumulator;
        }
      }

      // Check if this is an output file and its input file is in the accumulator.
      // If so, set it in the accumulator.
      const outFileRegex = /(?<prefix>.+)\.out\.(?<extension>.+)$/;
      const foundOut = file.match(outFileRegex);
      if (foundOut) {
        const prefix = foundOut.groups?.prefix;
        if (prefix) {
          const maybeTarget = accumulator.get(prefix);
          if (maybeTarget) {
            maybeTarget.outputPath = path.join(parentTestDirName, file);
          }
        }
      }
      return accumulator;
    }, new Map<string, TestTarget>());

  return [...testTargets.values()].filter((target) => target.outputPath.length > 0);
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
export const defaultLinterCheckTest = ({
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
    linterTestTargets.forEach(({ prefix, inputPath, outputPath }) => {
      it(prefix, async () => {
        const testRunResult = await driver.runCheckUnit(inputPath, linterName);
        expect(testRunResult).toMatchObject({
          success: true,
          // trunk-ignore(eslint/@typescript-eslint/no-unsafe-assignment)
          landingState: expect.objectContaining({
            taskFailures: [],
          }),
        });

        const expectedOutFile = path.resolve(dirname, path.parse(outputPath).base);
        // trunk-ignore(eslint/@typescript-eslint/no-unsafe-assignment)
        const expectedOutJson = JSON.parse(fs.readFileSync(expectedOutFile, { encoding: "utf-8" }));
        const expectedOut = extractLandingState(expectedOutJson);
        expect(testRunResult.landingState).toEqual(expectedOut);

        expect(testRunResult.landingState).toMatchSnapshot();
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
export const defaultLinterFmtTest = ({
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
    linterTestTargets.forEach(({ prefix, inputPath, outputPath }) => {
      it(prefix, async () => {
        const testRunResult = await driver.runFmtUnit(inputPath, linterName);
        expect(testRunResult).toMatchObject({
          success: true,
          // trunk-ignore(eslint/@typescript-eslint/no-unsafe-assignment)
          landingState: expect.objectContaining({
            taskFailures: [],
          }),
        });

        const expectedOutFile = path.resolve(dirname, path.parse(outputPath).base);
        // trunk-ignore(eslint/@typescript-eslint/no-non-null-assertion)
        expect(fs.readFileSync(testRunResult.targetPath!).toString()).toEqual(
          fs.readFileSync(expectedOutFile).toString()
        );
      });
    });
    postCheck(driver);
  });
};
