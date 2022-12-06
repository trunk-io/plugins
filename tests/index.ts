import { assert } from "console";
import * as fs from "fs";
import * as path from "path";
import { extractLandingState, ITestTarget, ITrunkVerb, TrunkDriver } from "tests/driver";
import { ILinterVersion, ITestingArguments } from "tests/types";

/*

FEATURE LIST TODO:
0. Fix imports
2. Extract out generic function for testing
4. Documentation
5. Poke around PR workflow

*/

const DEFAULT_TEST_TIMEOUT = 10000;

function parseLinterVersion(value: any) {
  return (value as ILinterVersion) ?? undefined;
}

const parseInputs = () =>
  <ITestingArguments>{
    cliVersion: process.env.PLUGINS_TEST_CLI_VERSION,
    cliPath: process.env.PLUGINS_TEST_CLI_PATH,
    linterVersion: parseLinterVersion(process.env.PLUGINS_TEST_LINTER_VERSION),
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

/*
GOALS OF THIS TEST HARNESS:
1. We are working to migrate all our linter definitions over to the plugin repo
  a. We need to preserve our testing logic and assertions that we had before

2. We want more peace of mind and guiderails for users (and us) who contribute to the plugins repo.
  a. Should be easy to grasp, easy to run

3. Test linters with basic.in.py -> basic.out.json (and some custom logic for the json subset asserts)
4. Test formatters with basic.in.py -> basic.out.py
5. Keep it simple but extensible

CONSIDERATIONS:
1. Because of the way trunk is run (git-dependent, trunk.yaml-dependent, etc.) this needs to be sandboxed
2. Want to easily run this (probs with a trunk action)
3. Want to easily filter, set cli/linter versions manually, etc.
*/

describe("Testing composite config", () => {
  // TODO: TYLER TEST ABSOLUTE REPO HEALTH (validate trunk config)
});

// export const genericTestLinterDefinition = (dirname: string, linterName: string) => {
//   // TODO: TYLER ADD/REFACTOR STUFF HERE FOR EXTENSIBILITY
//   // 1. Determine tests
//   // 2. Define trunk driver
//   // 3. Define setup/teardown
//   // 4. run each test, inside each:
//   //    - lambda taking in driver and some vars and dictating assertions
//   //    - this is necessary for things like asserting taskFailures, etc.
// };

export const defaultLinterDefinitionTest = (
  dirname: string,
  linterName: string,
  namedTestPrefixes: string[] = [],
  verb: ITrunkVerb
) => {
  // Step 1: Parse any custom inputs
  const inputArgs = parseInputs();
  if (inputArgs.cliVersion || inputArgs.cliPath || inputArgs.linterVersion) {
    console.debug(inputArgs);
  }

  jest.setTimeout(DEFAULT_TEST_TIMEOUT);

  describe(`Testing linter ${linterName}`, () => {
    // Step 2: Detect test files within a linter test directory
    const driver = new TrunkDriver(linterName, dirname, inputArgs);
    const linterTestTargets = detectTestTargets(dirname, namedTestPrefixes);

    // Step 3: Define test setup and teardown
    beforeAll(() => {
      driver.SetUp();
    });

    afterAll(() => {
      driver.TearDown();
    });

    // Step 4: Asynchronously run each test
    linterTestTargets.forEach((test_target) => {
      it(test_target.prefix, async () => {
        if (verb == ITrunkVerb.Check) {
          const test_run_result = await driver.RunCheck(test_target.inputPath);
          assert(test_run_result.success);

          const expected_out_file = path.join(dirname, path.parse(test_target.outputPath).base);
          const expected_out_json = JSON.parse(
            fs.readFileSync(expected_out_file, { encoding: "utf-8" })
          );
          const expected_out = extractLandingState(expected_out_json);
          expect(test_run_result.landingState).toEqual(expected_out);

          // TODO: TYLER SHOULD SNAPSHOT RUN CONDITIONALLY OR ONLY ON NIGHTLIES?
          expect(test_run_result.landingState).toMatchSnapshot();
        } else {
          const test_run_result = await driver.RunFmt(test_target.inputPath);
          assert(test_run_result.success);

          const expected_out_file = path.join(dirname, path.parse(test_target.outputPath).base);
          expect(fs.readFileSync(test_run_result.targetPath).toString()).toEqual(
            fs.readFileSync(expected_out_file).toString()
          );
        }
      });
    });
  });
};

export const defaultLinterCheckTest = (
  dirname: string,
  linterName: string,
  namedTestPrefixes: string[] = []
) => defaultLinterDefinitionTest(dirname, linterName, namedTestPrefixes, ITrunkVerb.Check);

export const defaultLinterFmtTest = (
  dirname: string,
  linterName: string,
  namedTestPrefixes: string[] = []
) => defaultLinterDefinitionTest(dirname, linterName, namedTestPrefixes, ITrunkVerb.Format);
