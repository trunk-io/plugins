const { exec } = require("child_process");
import { parse } from "ts-command-line-args";

// TODO: TYLER USE AND SANITIZE INPUTS

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

describe("Testing linter definitions", () => {
  // Step 1: Scan to determine testing targets
  let input_args = parseInputs();
  console.log("Parsed inputs");
  console.log(input_args);

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
