import { exec, execSync } from "child_process";
import { plainToClass } from "class-transformer";
import * as fs from "fs";
import { pick } from "lodash";
import * as os from "os";
import path from "path";
import * as git from "simple-git";
import * as util from "util";

import {
  FileIssue,
  IFileIssue,
  ILandingState,
  ILintAction,
  ILinterVersion,
  ITaskFailure,
  ITestingArguments,
  LandingState,
} from "../types";
const execpromise = util.promisify(exec);

const TEMP_PREFIX = "plugins_";
const REPO_ROOT = path.join(__dirname, "../..");
const ENABLE_TIMEOUT = 2000;

export interface ITestTarget {
  prefix: string;
  inputPath: string;
  outputPath: string;
}

export interface ITrunkRunResult {
  exit_code: number;
  stdout: string;
  stderr: string;
  error?: Error;
  outputJson: JSON;
}

export enum ITrunkVerb {
  Check = 1,
  Format,
}

export interface ITestResult {
  // TODO: TYLER SPECIFY BOTH VERSIONS
  success: boolean;
  trunkRunResult: ITrunkRunResult;
  trunkVerb: ITrunkVerb;
  targetPath: string;
  landingState?: ILandingState;
}

export const convertToLandingState = (json: JSON): ILandingState => {
  return json as ILandingState;

  // // Doesn't compile
  // let converted = json as Object as ILandingState;
  // let invalidKeys = [];
  // for (const property of Object.keys(converted)) {
  //   if (!(property in LandingState)) {
  //     invalidKeys.push(property);
  //     delete converted[property];
  //   }
  // }

  // // Doesn't work because the new LandingState() is empty
  // const specificMembers: string[] = Object.keys(new LandingState());
  // const specific: ILandingState = pick(json as Object as ILandingState, specificMembers);
  // return specific;

  // // Doesn't work because doesn't recurse
  // return plainToClass(LandingState, json, { excludeExtraneousValues: true });

  // const typedObject: LandingState = <ILandingState> json;
  // console.log(typedObject);
  // return typedObject;

  // let result = new LandingState();
  // return pick(json as Object, Object.keys(result)) as ILandingState;

  //   function extract<T>(properties: Record<keyof T, true>){
  //     return function<TActual extends T>(value: TActual){
  //         let result = {} as T;
  //         for (const property of Object.keys(properties) as Array<keyof T>) {
  //             result[property] = value[property];
  //         }
  //         return result;
  //     }
  // }
  // let obj = json as Object as ILandingState;
  // let result = new LandingState();
  // for (const property of Object.keys(result) as Array<keyof ILandingState>) {
  //   result[property] = obj[property];
  // }
  // return new LandingState(json as Object);
  // return result;
};

export class TrunkDriver {
  linter: string; // The name of the linter
  testDir: string; // Refers to the path to the test subdir inside a linter directory
  inputArgs: ITestingArguments;
  sandboxPath?: string; // Created in /tmp during setup
  gitDriver?: git.SimpleGit;

  constructor(linter: string, testDir: string, args: ITestingArguments) {
    this.linter = linter;
    this.testDir = testDir;
    this.inputArgs = args;
  }

  ParseLandingState(outputJson: JSON): ILandingState {
    const landingState = convertToLandingState(outputJson);

    const absLinterDir = path.parse(this.testDir).dir;
    const relativeLinterDir = path.relative(REPO_ROOT, absLinterDir);

    const transform_path = (testFileRelativePath: string): string => {
      // validate path is parsable
      const parsed = path.parse(testFileRelativePath);
      if (parsed.dir.length > 0) {
        return path.join(relativeLinterDir, testFileRelativePath);
      }
      return testFileRelativePath;
    };

    landingState.issues?.map((issue: FileIssue) => {
      // TODO: TYLER REMOVE THESE IFS IF INTERFACE NOT USED
      if (issue.file) {
        issue.file = transform_path(issue.file);
      }
    });
    landingState.unformatted_files?.map((issue: FileIssue) => {
      if (issue.file) {
        issue.file = transform_path(issue.file);
      }
    });
    landingState.lintActions?.map((action: ILintAction) => {
      action.paths = action.paths.map(transform_path);
    });
    landingState.taskFailures?.map((failure: ITaskFailure) => {
      failure.message = transform_path(failure.message);
    });

    // TODO: TYLER REMOVE
    console.log("post transform!!");
    console.log(landingState);

    return landingState;
  }

  ParseCheckResult(trunkRunResult: ITrunkRunResult, targetAbsPath: string): ITestResult {
    return {
      success: trunkRunResult.exit_code == 0 && trunkRunResult.stderr.length == 0,
      trunkRunResult,
      trunkVerb: ITrunkVerb.Check,
      targetPath: targetAbsPath,
      landingState: this.ParseLandingState(trunkRunResult.outputJson),
    };
  }

  ParseFmtResult(trunkRunResult: ITrunkRunResult, targetAbsPath: string): ITestResult {
    return {
      success: trunkRunResult.exit_code == 0 && trunkRunResult.stderr.length == 0,
      trunkRunResult,
      trunkVerb: ITrunkVerb.Format,
      targetPath: targetAbsPath,
      landingState: this.ParseLandingState(trunkRunResult.outputJson),
    };
  }

  GetLatestTrunkVersion(): string {
    // TODO: TYLER COMPUTE THIS ONCE STATICALLY AT TEST TIME
    return "1.1.1-beta.14";
  }

  TrunkYamlContents(): string {
    return `version: 0.1
cli:
  version: ${this.inputArgs.cliVersion ?? this.GetLatestTrunkVersion()}
plugins:
  sources:
  - id: trunk
    local: ${REPO_ROOT}
  `;
  }

  async SetUp() {
    this.sandboxPath = fs.mkdtempSync(path.join(os.tmpdir(), TEMP_PREFIX));
    if (this.sandboxPath) {
      // Create repo
      const sourceDir = path.join(this.testDir, "..");
      fs.cpSync(sourceDir, this.sandboxPath!, { recursive: true });
      this.gitDriver = git.simpleGit(this.sandboxPath);
      this.gitDriver.init();

      // Initialize trunk via config
      fs.mkdirSync(path.join(this.sandboxPath, ".trunk"));
      fs.writeFileSync(path.join(this.sandboxPath, ".trunk/trunk.yaml"), this.TrunkYamlContents());

      // Enable tested linter
      // TODO: TYLER DO SOMETHING BETTER THAN A TIMEOUT HERE
      const daemonCommand = `${this.inputArgs.cliPath ?? "trunk"} daemon launch --monitor=false`;
      exec(daemonCommand, { cwd: this.sandboxPath, timeout: 1000 });

      // TODO: TYLER HANDLE VERSIONING OF LINTER
      try {
        // Prefer calling enable over editing trunk.yaml directly because it also handles runtimes, etc.
        const enableCommand = `${this.inputArgs.cliPath ?? "trunk"} check enable ${
          this.linter
        } --monitor=false`;
        execSync(enableCommand, { cwd: this.sandboxPath });
      } catch (error) {
        console.warn(`Failed to enable ${this.linter} with message ${(error as Error).message}`);
      }
    }
  }

  async TearDown() {
    console.log(this.sandboxPath);
    // TODO: TYLER SHOULD THIS DEINIT FIRST IN ORDER TO REMOVE CACHE INFO?
    // if (this.sandboxPath) {
    //   fs.rmSync(this.sandboxPath, {recursive: true});
    // }
  }

  async RunCheck(targetRelativePath: string): Promise<ITestResult> {
    const targetAbsPath = path.join(this.sandboxPath ?? "", targetRelativePath);
    const resultJsonPath = `${targetAbsPath}.json`;

    const command = `${
      this.inputArgs.cliPath ?? "trunk"
    } check -n --output-file=${resultJsonPath} --no-progress ${targetAbsPath} --filter=${
      this.linter
    }`; // TODO: TYLER ADD FILTER WITH LINTER

    return execpromise(command, { cwd: this.sandboxPath })
      .then(
        ({ stdout, stderr }) =>
          <ITrunkRunResult>{
            exit_code: 0,
            stdout,
            stderr,
            outputJson: JSON.parse(fs.readFileSync(resultJsonPath, { encoding: "utf-8" })),
          }
      )
      .then((trunkRunResult) => this.ParseCheckResult(trunkRunResult, targetAbsPath))
      .catch((error: Error) => {
        console.info(`Failure running 'trunk check' with message ${(error as Error).message}`);
        const trunkRunResult = <ITrunkRunResult>{
          exit_code: (error as any)["code"],
          stdout: (error as any)["stdout"],
          stderr: (error as any)["stderr"],
        };
        return <ITestResult>{
          success: false,
          trunkRunResult,
          trunkVerb: ITrunkVerb.Check,
          targetPath: targetAbsPath,
        };
      });
  }

  async RunFmt(targetRelativePath: string): Promise<ITestResult> {
    const targetAbsPath = path.join(this.sandboxPath ?? "", targetRelativePath);
    const resultJsonPath = `${targetAbsPath}.json`;

    const command = `${
      this.inputArgs.cliPath ?? "trunk"
    } fmt ${targetAbsPath} --output-file=${resultJsonPath} --no-progress --filter=${this.linter}`; // TODO: TYLER ADD FILTER WITH LINTER

    return execpromise(command, { cwd: this.sandboxPath })
      .then(
        ({ stdout, stderr }) =>
          <ITrunkRunResult>{
            exit_code: 0,
            stdout,
            stderr,
            outputJson: JSON.parse(fs.readFileSync(resultJsonPath, { encoding: "utf-8" })),
          }
      )
      .then((trunkRunResult) => this.ParseFmtResult(trunkRunResult, targetAbsPath))
      .catch((error: Error) => {
        console.info(`Failure running 'trunk fmt' with message ${(error as Error).message}`);
        const trunkRunResult = <ITrunkRunResult>{
          exit_code: (error as any)["code"],
          stdout: (error as any)["stdout"],
          stderr: (error as any)["stderr"],
        };
        return <ITestResult>{
          success: false,
          trunkRunResult,
          trunkVerb: ITrunkVerb.Format,
          targetPath: targetAbsPath,
        };
      });
  }
}
