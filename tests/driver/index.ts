import { exec, execSync } from "child_process";
import { sort } from "fast-sort";
import * as fs from "fs";
import * as os from "os";
import path from "path";
import * as git from "simple-git";
import {
  IFileIssue,
  ILandingState,
  ILintAction,
  ILinterVersion,
  ITaskFailure,
  ITestingArguments,
} from "tests/types";
import * as util from "util";
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
  exitCode: number;
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

export const extractLandingState = (json: JSON): ILandingState => {
  // Remove unwanted fields. Prefer object destructuring to be explicit about required fields
  // for forward compatibility.
  const extractFIFields = ({
    file,
    line,
    column,
    message,
    code,
    level,
    linter,
    targetType,
    ranges,
    issueUrl,
    ..._rest
  }: IFileIssue): IFileIssue => ({
    file,
    line,
    column,
    message,
    code,
    level,
    linter,
    targetType,
    ranges,
    issueUrl,
  });

  // Also de-dupe, since sometimes we will have discrepancies in the count for multiple commands
  const extractLAFields = ({
    paths,
    linter,
    parser,
    report,
    upstream,
    fileGroupName,
    command,
    verb,
    ..._rest
  }: ILintAction): ILintAction => ({
    paths,
    linter,
    parser,
    report,
    upstream,
    fileGroupName,
    command,
    verb,
  });

  const extractTFFields = ({ name, message, ..._rest }: ITaskFailure): ITaskFailure => ({
    name,
    message,
  });

  const extractLSFields = ({
    issues = [],
    unformattedFiles = [],
    lintActions = [],
    taskFailures = [],
    ..._rest
  }: ILandingState): ILandingState => {
    const res = <ILandingState>{
      issues,
      unformattedFiles,
      lintActions,
      taskFailures,
    };

    res.issues = sort(res.issues?.map(extractFIFields) ?? []).asc([
      (issue) => issue.file,
      (issue) => issue.line,
      (issue) => issue.column,
      (issue) => issue.message,
    ]);
    res.unformattedFiles = sort(res.unformattedFiles?.map(extractFIFields) ?? []).asc([
      (issue) => issue.file,
      (issue) => issue.line,
      (issue) => issue.column,
      (issue) => issue.message,
    ]);
    res.lintActions = sort(res.lintActions?.map(extractLAFields) ?? []).asc([
      (action) => action.linter,
      (action) => action.command,
      (action) => action.verb,
      (action) => action.upstream,
      (action) => action.paths,
    ]);
    res.taskFailures = sort(res.taskFailures?.map(extractTFFields) ?? []).asc([
      (failure) => failure.name,
      (failure) => failure.message,
    ]);

    return res;
  };

  return extractLSFields(json as ILandingState);
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

  TryParseLandingState(outputJson: JSON): ILandingState | undefined {
    if (!outputJson) {
      return undefined;
    }

    const landingState = extractLandingState(outputJson);

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

    landingState.issues?.map((issue: IFileIssue) => {
      issue.file = transform_path(issue.file);
    });
    landingState.unformattedFiles?.map((issue: IFileIssue) => {
      issue.file = transform_path(issue.file);
    });
    landingState.lintActions?.map((action: ILintAction) => {
      action.paths = action.paths.map(transform_path);
    });
    landingState.taskFailures?.map((failure: ITaskFailure) => {
      failure.message = transform_path(failure.message);
    });

    // TODO: TYLER REMOVE
    // console.log("post transform!!");
    // console.log(landingState);
    // console.log("post transform 2!!");
    // console.log(landingState.lintActions);

    return landingState;
  }

  ParseCheckResult(trunkRunResult: ITrunkRunResult, targetAbsPath: string): ITestResult {
    return {
      success: trunkRunResult.exitCode == 0 && trunkRunResult.stderr.length == 0,
      trunkRunResult,
      trunkVerb: ITrunkVerb.Check,
      targetPath: targetAbsPath,
      landingState: this.TryParseLandingState(trunkRunResult.outputJson),
    };
  }

  ParseFmtResult(trunkRunResult: ITrunkRunResult, targetAbsPath: string): ITestResult {
    return {
      success: trunkRunResult.exitCode == 0 && trunkRunResult.stderr.length == 0,
      trunkRunResult,
      trunkVerb: ITrunkVerb.Format,
      targetPath: targetAbsPath,
      landingState: this.TryParseLandingState(trunkRunResult.outputJson),
    };
  }

  // THIS SHOULD NOT USE LATEST. IT SHOULD USE WHAT'S IN THE ROOT TRUNK.YAML IN ORDER TO BE CLEAR (IF NOT SPECIFIED)
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
      fs.cpSync(sourceDir, this.sandboxPath, { recursive: true });
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
    const deinitCommand = `${this.inputArgs.cliPath ?? "trunk"} deinit`;
    exec(deinitCommand, { cwd: this.sandboxPath, timeout: 1000 });
    if (this.sandboxPath) {
      fs.rmSync(this.sandboxPath, { recursive: true });
    }
  }

  async RunCheck(targetRelativePath: string): Promise<ITestResult> {
    const targetAbsPath = path.join(this.sandboxPath ?? "", targetRelativePath);
    const resultJsonPath = `${targetAbsPath}.json`;

    const command = `${
      this.inputArgs.cliPath ?? "trunk"
    } check -n --output-file=${resultJsonPath} --no-progress --upstream=false --filter=${
      this.linter
    } ${targetAbsPath}`;

    return execpromise(command, { cwd: this.sandboxPath })
      .then(({ stdout, stderr }) =>
        this.ParseCheckResult(
          {
            exitCode: 0,
            stdout,
            stderr,
            outputJson: JSON.parse(fs.readFileSync(resultJsonPath, { encoding: "utf-8" })),
          },
          targetAbsPath
        )
      )
      .catch((error: Error) => {
        const trunkRunResult = <ITrunkRunResult>{
          exitCode: (error as any)["code"],
          stdout: (error as any)["stdout"],
          stderr: (error as any)["stderr"],
          outputJson: JSON.parse(fs.readFileSync(resultJsonPath, { encoding: "utf-8" })),
        };

        if (trunkRunResult.exitCode != 1) {
          console.log("Failure running 'trunk check'");
          console.log(error);
        }
        return this.ParseCheckResult(trunkRunResult, targetAbsPath);
      });
  }

  async RunFmt(targetRelativePath: string): Promise<ITestResult> {
    const targetAbsPath = path.join(this.sandboxPath ?? "", targetRelativePath);
    const resultJsonPath = `${targetAbsPath}.json`;

    const command = `${
      this.inputArgs.cliPath ?? "trunk"
    } fmt ${targetAbsPath} --output-file=${resultJsonPath} --no-progress --filter=${this.linter}`;

    return execpromise(command, { cwd: this.sandboxPath })
      .then(({ stdout, stderr }) =>
        this.ParseFmtResult(
          {
            exitCode: 0,
            stdout,
            stderr,
            outputJson: JSON.parse(fs.readFileSync(resultJsonPath, { encoding: "utf-8" })),
          },
          targetAbsPath
        )
      )
      .catch((error: Error) => {
        const trunkRunResult = <ITrunkRunResult>{
          exitCode: (error as any)["code"],
          stdout: (error as any)["stdout"],
          stderr: (error as any)["stderr"],
          outputJson: JSON.parse(fs.readFileSync(resultJsonPath, { encoding: "utf-8" })),
        };
        if (trunkRunResult.exitCode != 1) {
          console.log("Failure running 'trunk fmt'");
          console.log(error);
        }
        return this.ParseCheckResult(trunkRunResult, targetAbsPath);
      });
  }
}
