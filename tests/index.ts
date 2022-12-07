import * as fs from "fs";
import * as path from "path";
import { extractLandingState, ISetupSettings, ITestTarget, TrunkDriver } from "tests/driver";
import { ILinterVersion, ITestingArguments } from "tests/types";

/*

// TODO: TYLER
FEATURE LIST TODO:
0. Fix imports
4. Documentation
5. Poke around PR workflow

*/

let printed_args = false;

const parseLinterVersion = (value: any): ILinterVersion | undefined => {
  return (value as ILinterVersion) ?? undefined;
};

export const parseInputs = () => {
  const args = <ITestingArguments>{
    cliVersion: process.env.PLUGINS_TEST_CLI_VERSION,
    cliPath: process.env.PLUGINS_TEST_CLI_PATH,
    linterVersion: parseLinterVersion(process.env.PLUGINS_TEST_LINTER_VERSION),
  };
  if (!printed_args && (args.cliVersion || args.cliPath || args.linterVersion)) {
    console.debug(args);
    printed_args = true;
  }
  return args;
};

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
