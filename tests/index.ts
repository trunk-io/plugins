import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { parse } from "ts-command-line-args";

// TODO: TYLER USE AND SANITIZE INPUTS
const LINTER_DIR = path.join(__dirname, "../linters/");
const TEST_SUBDIR = "test";

enum ILinterVersion {
  KnownGoodVersion = 1,
  Latest,
}

function parseLinterVersion(value: any) {
  return (value as ILinterVersion) ?? undefined;
}

interface ITestingArguments {
  cliVersion?: string;
  cliPath?: string;
  linterVersion?: ILinterVersion;
  linters?: string[];
  verbose?: boolean;
  help?: boolean;
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

// TODO: TYLER USE https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
//  trunk actions run plugin-tests -- --filter=pylint

// async function execute_trunk(command: string) {
//   console.log("executing trunk");

//   exec(command, (err: any, stdout: any, stderr: any) => {
//     console.log(err);
//     console.log(stdout);
//     console.log(stderr);
//   });
// }

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
    console.warn(`'${linter_path}' does not have a test directory`);
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
      console.debug(e);
    }
  });
  return files;
};

describe("Testing linter definitions", () => {
  // Step 1: Scan to determine testing targets
  // TODO: TYLER MAKE SURE THIS HAS A GOOD CATCH FOR BAD ARGS
  let input_args = parseInputs();
  console.debug("Parsed inputs:");
  console.debug(input_args);

  var linter_targets = [];
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
  console.log(`Running ${linter_targets.length} tests`);

  // Step 2: Run setup

  // Step 3: Asynchronously run each test

  // Step 4: Report output

  // Step 5: Cleanup

  for (let i = 0; i < 3; i++) {
    let test_name = ["foo-test", "bar-test", "baz-test"][i];
    test(test_name, async () => {
      // await execute_trunk("trunk --version");

      // await exec("trunk --version", (err: any, stdout: any, stderr: any) => {
      //   console.log("executing trunk");
      //   console.log(err);
      //   console.log(stdout);
      //   console.log(stderr);
      // });

      expect(1 - 1).toBe(0);
      // expect(1 - 1).toBe(1);
    });
  }
});
