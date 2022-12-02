import * as fs from "fs";
import * as path from "path";
import { parse } from "ts-command-line-args";
import { ILinterVersion, ITestingArguments } from "./types";
import { ITestResult, TrunkDriver } from "./driver/driver";

/*

FEATURE LIST TODO:
1. Documentation
2. Additional customization by command line
3. PR workflow

*/

// TODO: TYLER FIX CASING
const LINTER_DIR = path.join(__dirname, "../linters/");
const TEST_SUBDIR = "test";

function parseLinterVersion(value: any) {
  return (value as ILinterVersion) ?? undefined;
}

const parseInputs = (): ITestingArguments =>
  parse<ITestingArguments>(
    {
      cliVersion: {
        type: String,
        optional: true,
        description: "trunk cli version to run",
      },
      cliPath: {
        type: String,
        optional: true,
        description: "path to the trunk cli binary",
      },
      linterVersion: {
        type: parseLinterVersion,
        optional: true,
        description: "linter version to use { KnownGoodVersion | Latest }",
      },
      linters: {
        // TODO: TYLER ADD BETTER FILTER (E.G. COMMA SEPARATED)
        type: String,
        optional: true,
        multiple: true,
        description: "linter definition(s) to run tests against",
      },
      verbose: { type: Boolean, optional: true },
      help: { type: Boolean, optional: true, alias: "h" },
    },
    {
      helpArg: "help",
      headerContentSections: [{ header: "Trunk Plugins Testing" }],
    }
  );
// TODO: TYLER GET THE HELP TEXT WORKING

const scanLinterPathForTests = (linter: string): string | undefined => {
  let linter_path = path.join(LINTER_DIR, linter);
  if (!fs.existsSync(linter_path)) {
    throw new Error(`linter dir '${linter_path}' does not exist`);
  }

  if (!fs.lstatSync(linter_path).isDirectory()) {
    throw new Error(`linter '${linter_path}' is not a directory`);
  }

  if (
    fs.existsSync(path.join(linter_path, TEST_SUBDIR)) &&
    fs.lstatSync(path.join(linter_path, TEST_SUBDIR)).isDirectory()
  ) {
    console.log(`${path.join(linter_path, TEST_SUBDIR)} exists and is dir`);
  } else {
    console.log(`'${linter_path}' does not have a test directory`);
  }
  return linter_path; // TODO: TYLER ONLY PUT THIS INSIDE OF THE FIRST IF
};

const scanAllRepoLinters = (): string[] => {
  let files: string[] = [];
  console.log("about to scan...");
  fs.readdirSync(LINTER_DIR).forEach((linter: string) => {
    try {
      let linter_path = scanLinterPathForTests(linter);
      if (linter_path) {
        files.push(linter_path);
      }
    } catch (e) {
      console.debug((e as Error).message);
    }
  });
  return files;
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

/*
      // TODO: SEE IF JEST DOES THIS WELL ENOUGH
    // TODO: TYLER USE FILES FOR TARGETS
    var linter_targets: string[] = [];
    if ((input_args.linters ?? []).length == 0) {
      linter_targets = scanAllRepoLinters();
    } else {
      input_args.linters?.forEach((linter) => {
        let linter_path = scanLinterPathForTests(linter);
        if (linter_path) {
          linter_targets.push(linter_path);
        }
      });
    }
    console.log(`***Detected ${linter_targets.length} tests***`);

    test("Detected tests", () => {});
*/

describe("Testing composite config", () => {
  // TODO: TYLER TEST ABSOLUTE REPO HEALTH
});

export const genericTestDefinition = (dirname: string, linterName: string) => {
  // TODO: TYLER ADD STUFF HERE FOR EXTENSIBILITY
};

export const defaultTestDefinition = (
  dirname: string,
  linterName: string,
  linter_test_targets: string[] = []
) => {
  describe(`Testing linter ${linterName}`, () => {
    // Step 1: Parse any custom inputs
    let input_args = parseInputs();
    console.debug("Parsed inputs:");
    console.debug(input_args);

    // Step 2: Detect test files within a linter test directory

    // basic.in.py basic.out.py foo.in.py foo.out.py
    let driver = new TrunkDriver(dirname, input_args);
    if (linter_test_targets.length == 0) {
      linter_test_targets = ["basic"]; // TODO: TYLER DETECT ALL THE TESTS
    }

    // Step 3: Asynchronously run each test
    // var linter_test_runs = new Map<string, Promise<ITestResult>>();

    linter_test_targets.forEach((test_target) => {
      it(`${linterName} ${test_target}`, async () => {
        // Step 4: Run any test setup
        // TODO: TYLER DO SETUP, USE BEFORE/AFTER

        let test_run_result = await driver.RunCheck(linterName);

        // Step 5: Report output and asserts
        // TODO: TYLER SNAPSHOTS***
        // TODO: TYLER JEST PARTIAL MATCHING

        // console.log(test_run_result);
        console.log(
          `Got test result with json: ${test_run_result.trunk_run_result.stdout}`
        );

        // Step 6: Cleanup
        // TODO: TYLER DO Cleanup, USE BEFORE/AFTER
      });
    });
  });
};
