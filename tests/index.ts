import * as fs from "fs";
import * as path from "path";
import { extractLandingState, ISetupSettings, ITestTarget, TrunkDriver } from "tests/driver";
import { ILinterVersion, ITestingArguments } from "tests/types";

let printed_args = false;

// Parse the environment variable-specified linter version. This can either be
// - KnownGoodVersion, which parses the linter definition and attempts to specify a known_good_version
// - Latest, which automatically retrieves the latest linter version if network connectivity is available
// - A specified version. Note that this will apply to all tests, so only use this environment variable when tests are filtered
const parseLinterVersion = (value: string): ILinterVersion | string | undefined => {
  if (value == "KnownGoodVersion") {
    return ILinterVersion.KnownGoodVersion;
  } else if (value == "Latest") {
    return ILinterVersion.Latest;
  } else if (value && value.length > 0) {
    return value;
  }
  return undefined;
};

// Parse the global testing config inputs, specified as environment variables.
// - PLUGINS_TEST_CLI_VERSION replaces the repo-wide trunk.yaml's specified cli-version
// - PLUGINS_TEST_CLI_PATH specifies an alternative path to a trunk binary
// - PLUGINS_TEST_LINTER_VERSION specifies a linter version semantic (see 'parseLinterVersion')
export const parseInputs = () => {
  const args = <ITestingArguments>{
    cliVersion: process.env.PLUGINS_TEST_CLI_VERSION,
    cliPath: process.env.PLUGINS_TEST_CLI_PATH,
    linterVersion: parseLinterVersion(process.env.PLUGINS_TEST_LINTER_VERSION ?? ""),
  };
  if (!printed_args && (args.cliVersion || args.cliPath || args.linterVersion)) {
    console.debug(args);
    printed_args = true;
  }
  return args;
};

// If 'namedTestPrefixes' are specified, checks for their existence in 'dirname'. Otherwise,
// automatically scan 'dirname' for all available test input/output pairs.
const detectTestTargets = (dirname: string, namedTestPrefixes: string[]): ITestTarget[] => {
  const parentTestDirName = path.parse(dirname).name;
  const testTargets = new Map<string, ITestTarget>();
  // Sort guarantees basic.in comes before basic.out
  fs.readdirSync(dirname)
    .sort()
    .forEach((file: string) => {
      const inFileRegex = /(?<prefix>.+)\.in\.(?<extension>.+)$/;
      const foundIn = file.match(inFileRegex);
      if (foundIn) {
        const prefix = foundIn.groups?.prefix;
        if (prefix && (namedTestPrefixes.includes(prefix) || namedTestPrefixes.length == 0)) {
          testTargets.set(prefix, {
            prefix,
            inputPath: path.join(parentTestDirName, file),
            outputPath: "",
          });
        }
        return;
      }

      const outFileRegex = /(?<prefix>.+)\.out\.(?<extension>.+)$/;
      const foundOut = file.match(outFileRegex);
      if (foundOut) {
        const prefix = foundOut.groups?.prefix;
        if (prefix) {
          const maybe_target = testTargets.get(prefix);
          if (maybe_target) {
            maybe_target.outputPath = path.join(parentTestDirName, file);
          }
        }
      }
    });
  return Array.from(testTargets.values()).filter((target) => target.outputPath.length > 0);
};

// Setup the TrunkDriver to run tests in a 'dirname'. 'dirname' should be the path to the test subdirectory in a linter folder
// If a 'linterName' is specified, that linter will be enabled during setup according to specification in 'inputArgs'.
export const setupDriver = (
  dirname: string,
  inputArgs: ITestingArguments,
  setupSettings: ISetupSettings,
  linterName?: string
): TrunkDriver => {
  const driver = new TrunkDriver(dirname, inputArgs, setupSettings, linterName);

  beforeAll(() => {
    driver.SetUp();
  });

  afterAll(() => {
    driver.TearDown();
  });
  return driver;
};

// Test that running a linter filtered by 'linterName' on the test files in 'dirname' produces the desired output json.
// Either detect input and ouptut files automatically, or specify their prefixes as `namedTestPrefixes`. Output files should be of
// .json type, regardless of the input file format.
export const defaultLinterCheckTest = (
  dirname: string,
  linterName: string,
  namedTestPrefixes: string[] = []
) => {
  describe(`Testing linter ${linterName}`, () => {
    // Step 1: Parse any custom inputs
    const inputArgs = parseInputs();

    // Step 2: Define test setup and teardown
    const driver = setupDriver(dirname, inputArgs, {}, linterName);

    // Step 3: Detect test files to run
    const linterTestTargets = detectTestTargets(dirname, namedTestPrefixes);

    // Step 4: Asynchronously run each test
    linterTestTargets.forEach((test_target) => {
      it(test_target.prefix, async () => {
        const test_run_result = await driver.RunCheckUnit(test_target.inputPath, linterName);
        expect(test_run_result.success);

        const expected_out_file = path.join(dirname, path.parse(test_target.outputPath).base);
        const expected_out_json = JSON.parse(
          fs.readFileSync(expected_out_file, { encoding: "utf-8" })
        );
        const expected_out = extractLandingState(expected_out_json);
        expect(test_run_result.landingState).toEqual(expected_out);

        expect(test_run_result.landingState).toMatchSnapshot();
      });
    });
  });
};

// Test that running a formatter filtered by 'linterName' on the test files in 'dirname' produces the desired output files.
// Either detect input and ouptut files automatically, or specify their prefixes as `namedTestPrefixes`.
export const defaultLinterFmtTest = (
  dirname: string,
  linterName: string,
  namedTestPrefixes: string[] = []
) => {
  describe(`Testing formatter ${linterName}`, () => {
    // Step 1: Parse any custom inputs
    const inputArgs = parseInputs();

    // Step 2: Define test setup and teardown
    const driver = setupDriver(dirname, inputArgs, {}, linterName);

    // Step 3: Detect test files to run
    const linterTestTargets = detectTestTargets(dirname, namedTestPrefixes);

    // Step 4: Asynchronously run each test
    linterTestTargets.forEach((test_target) => {
      it(test_target.prefix, async () => {
        const test_run_result = await driver.RunFmtUnit(test_target.inputPath, linterName);
        expect(test_run_result.success);

        const expected_out_file = path.join(dirname, path.parse(test_target.outputPath).base);
        expect(fs.readFileSync(test_run_result.targetPath!).toString()).toEqual(
          fs.readFileSync(expected_out_file).toString()
        );
      });
    });
  });
};
