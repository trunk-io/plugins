import { exec, execSync } from "child_process";
import path from "path";
import * as util from "util";
import { ILinterVersion, ITestingArguments } from "../types";
const execpromise = util.promisify(exec);

export interface ITrunkRunResult {
  exit_code: number;
  stdout: string;
  stderr: string;
  error?: Error;
}

export interface ITestResult {
  success: boolean;
  trunk_run_result: ITrunkRunResult;
  comparison_result: string;
  target_path: string;
  // TODO: TYLER ANYTHING ELSE??
}

export class TrunkDriver {
  dirname: string;
  input_args: ITestingArguments;

  constructor(dirname: string, args: ITestingArguments) {
    this.dirname = dirname;
    this.input_args = args;
  }

  ParseRunResult(trunk_run_result: ITrunkRunResult): ITestResult {
    return {
      success: false,
      trunk_run_result,
      comparison_result: "comparison", // TODO: TYLER ADD FIELDS
      target_path: "foo",
    };
  }

  async RunCheck(linter_name: string): Promise<ITestResult> {
    // let linter_path = path.join("..", linter_name);
    let test_path = this.dirname;

    let command = `${
      this.input_args.cliPath ?? "trunk"
    } check -n --output=json ${test_path} --filter=${linter_name}`; // TODO: TYLER ADD FILTER WITH LINTER

    return execpromise(command)
      .then(
        ({ stdout, stderr }) =>
          <ITrunkRunResult>{
            exit_code: 0, // TODO: TYLER VERIFY THIS EXIT CODE
            stdout,
            stderr,
          }
      )
      .then((trunk_run_result) => this.ParseRunResult(trunk_run_result))
      .catch((error: Error) => {
        console.warn("We got an error:");
        console.warn(error);
        // TODO: TYLER HANDLE ERROR

        return <ITestResult>{};
      });
  }
}
