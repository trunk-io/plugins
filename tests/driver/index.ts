import { exec, ExecOptions, execSync } from "child_process";
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
import YAML from "yaml";

const execpromise = util.promisify(exec);
const TEMP_PREFIX = "plugins_";
export const REPO_ROOT = path.join(__dirname, "../..");
const ENABLE_TIMEOUT = 1000;

// A specified test target to run on, identified by a prefix.
// inputPath and outputPath should be relative paths relative to the
// specific linter subdirectory.
export interface ITestTarget {
  prefix: string;
  inputPath: string;
  outputPath: string;
}

// The result of running a 'trunk check' or 'trunk fmt' command.
// outputJson will attempt to be parsed from the result if successful.
export interface ITrunkRunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  error?: Error;
  outputJson: JSON;
}

// Which primary trunk command was run.
export enum ITrunkVerb {
  Check = 1,
  Format,
}

// The result of all invocations run during an individual test. This includes
// additional information parsed from the resulting json if successful.
export interface ITestResult {
  success: boolean;
  trunkRunResult: ITrunkRunResult;
  trunkVerb: ITrunkVerb;
  targetPath?: string;
  landingState?: ILandingState;
}

// Read and parse a YAML file.
export const parseYaml = (filePath: string) => {
  const yamlContents = fs.readFileSync(filePath, "utf8");
  return YAML.parse(yamlContents);
};

// Extract the LandingState from an input 'json', only retrieving assertable fields. Discard
// fields that depend on git and cache states. Also sorts repeatable fields deterministically.
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

// Configuration for when a TrunkDriver instance runs 'SetUp'.
export interface ISetupSettings {
  setupGit?: boolean;
  setupTrunk?: boolean;
}

// The primary means for setting up and running trunk commands in a test
export class TrunkDriver {
  linter?: string; // The name of the linter. If defined, enable the linter during setup
  testDir: string; // Refers to the path to the test subdir inside a linter directory
  inputArgs: ITestingArguments;
  sandboxPath?: string; // Created in /tmp during setup
  gitDriver?: git.SimpleGit; // Created during setup
  setupSettings: ISetupSettings;

  constructor(
    testDir: string,
    args: ITestingArguments,
    { setupGit, setupTrunk }: ISetupSettings,
    linter?: string
  ) {
    this.linter = linter;
    this.testDir = testDir;
    this.inputArgs = args;
    this.setupSettings = {
      setupGit: setupGit ?? true,
      setupTrunk: setupTrunk ?? true,
    };
  }

  // Attempt to parse the JSON result of a 'trunk check' or 'trunk fmt' run into
  // A landing state, transforming all relative paths to match them as they would appear
  // from the repo root.
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

    return landingState;
  }

  // Convert a ITrunkRunResult into a full ITestResult.
  ParseRunResult(
    trunkRunResult: ITrunkRunResult,
    trunkVerb: ITrunkVerb,
    targetAbsPath?: string
  ): ITestResult {
    return {
      success: trunkRunResult.exitCode == 0 && trunkRunResult.stderr.length == 0,
      trunkRunResult,
      trunkVerb,
      targetPath: targetAbsPath,
      landingState: this.TryParseLandingState(trunkRunResult.outputJson),
    };
  }

  // Retrieve the desired trunk version for tests. Prefer the environment variable-specified version,
  // then the cli version in the .trunk/trunk.yaml of the repository root.
  GetTrunkVersion(): string {
    const repoCliVersion = parseYaml(path.join(REPO_ROOT, ".trunk/trunk.yaml"))["cli"]["version"];
    return this.inputArgs.cliVersion ?? repoCliVersion ?? "1.1.1-beta.14";
  }

  // Generate contents for a newly generated, empty trunk.yaml.
  TrunkYamlContents(): string {
    return `version: 0.1
cli:
  version: ${this.GetTrunkVersion()}
plugins:
  sources:
  - id: trunk
    local: ${REPO_ROOT}
  `;
  }

  // Return the yaml result of parsing the .trunk/trunk.yaml in the test sandbox.
  GetTrunkConfig = () => {
    const trunkYamlPath = path.join(this.sandboxPath ?? "", ".trunk/trunk.yaml");
    return parseYaml(trunkYamlPath);
  };

  // Return the yaml result of parsing the output of 'trunk config print' in the test sandbox.
  GetFullTrunkConfig = () => {
    const printConfig = execSync(`${this.inputArgs.cliPath ?? "trunk"} config print`);
    return YAML.parse(printConfig.toString());
  };

  // Parse the result of 'GetFullTrunkConfig' in the context of 'inputArgs' to identify the desired linter version to enable.
  ExtractLinterVersion = (): string => {
    if (!this.inputArgs.linterVersion || this.inputArgs.linterVersion == ILinterVersion.Latest) {
      return "";
    } else if (this.inputArgs.linterVersion == ILinterVersion.KnownGoodVersion) {
      const fullTrunkConfig = this.GetFullTrunkConfig();
      for (const def of fullTrunkConfig["lint"]["definitions"]) {
        if (def["name"] == this.linter) {
          return def["known_good_version"] ?? "";
        }
      }
      return "";
    } else {
      return this.inputArgs.linterVersion;
    }
  };

  // Setup a sandbox test directory by copying in test contents and conditionally:
  // 1. Creating a git repo
  // 2. Dumping a newly generated trunk.yaml
  // 3. Enabling the specified 'linter'
  async SetUp() {
    this.sandboxPath = fs.mkdtempSync(path.join(os.tmpdir(), TEMP_PREFIX));
    if (this.sandboxPath) {
      // Create repo
      const sourceDir = path.join(this.testDir, "..");
      fs.cpSync(sourceDir, this.sandboxPath, { recursive: true });

      if (this.setupSettings.setupGit) {
        this.gitDriver = git.simpleGit(this.sandboxPath);
        this.gitDriver.init();
      }

      if (this.setupSettings.setupTrunk) {
        // Initialize trunk via config
        fs.mkdirSync(path.join(this.sandboxPath, ".trunk"));
        fs.writeFileSync(
          path.join(this.sandboxPath, ".trunk/trunk.yaml"),
          this.TrunkYamlContents()
        );
      }

      // Enable tested linter if specified
      if (this.linter) {
        const daemonCommand = `${this.inputArgs.cliPath ?? "trunk"} daemon launch --monitor=false`;
        exec(daemonCommand, { cwd: this.sandboxPath, timeout: ENABLE_TIMEOUT });
        try {
          const version = this.ExtractLinterVersion();
          const versionString = version.length > 0 ? `@${version}` : "";
          const linterVersionString = `${versionString}${this.linter}`;

          // Prefer calling enable over editing trunk.yaml directly because it also handles runtimes, etc.
          const enableCommand = `${
            this.inputArgs.cliPath ?? "trunk"
          } check enable ${linterVersionString} --monitor=false`;
          execSync(enableCommand, { cwd: this.sandboxPath });
        } catch (error) {
          console.warn(`Failed to enable ${this.linter} with message ${(error as Error).message}`);
        }
      }
    }
  }

  // Delete the sandbox testing directory and its contents, as well as removing any trunk information
  // associated with it in order to prune the cache.
  async TearDown() {
    const deinitCommand = `${this.inputArgs.cliPath ?? "trunk"} deinit`;
    exec(deinitCommand, { cwd: this.sandboxPath, timeout: 1000 });
    if (this.sandboxPath) {
      fs.rmSync(this.sandboxPath, { recursive: true });
    }
  }

  // Run a specified trunk command with 'args' (omit 'trunk') and additional options.
  async Run(args: string, execOptions?: ExecOptions) {
    const fullCommand = `${this.inputArgs.cliPath ?? "trunk"} ${args}`;
    return execpromise(fullCommand, { cwd: this.sandboxPath, ...execOptions });
  }

  // Run a 'trunk check' command with additional options.
  async RunCheck(
    args = "",
    targetAbsPath?: string,
    resultJsonPath: string = path.join(this.sandboxPath ?? "", "result.json")
  ) {
    const fullArgs = `check -n --output-file=${resultJsonPath} --no-progress ${args}`;

    return this.Run(fullArgs)
      .then(({ stdout, stderr }) =>
        this.ParseRunResult(
          {
            exitCode: 0,
            stdout,
            stderr,
            outputJson: JSON.parse(fs.readFileSync(resultJsonPath, { encoding: "utf-8" })),
          },
          ITrunkVerb.Check,
          targetAbsPath
        )
      )
      .catch((error: Error) => {
        const er = error as any;
        const trunkRunResult = <ITrunkRunResult>{
          exitCode: er["code"],
          stdout: er["stdout"],
          stderr: er["stderr"],
          outputJson: JSON.parse(fs.readFileSync(resultJsonPath, { encoding: "utf-8" })),
        };

        if (trunkRunResult.exitCode != 1) {
          console.log("Failure running 'trunk check'");
          console.log(error);
        }
        return this.ParseRunResult(trunkRunResult, ITrunkVerb.Check, targetAbsPath);
      });
  }

  // Run 'trunk check' on a specified target 'targetRelativePath' with a 'linter' filter.
  // Prefer this to 'RunCheck' when possible.
  async RunCheckUnit(targetRelativePath: string, linter: string): Promise<ITestResult> {
    const targetAbsPath = path.join(this.sandboxPath ?? "", targetRelativePath);
    const resultJsonPath = `${targetAbsPath}.json`;
    const args = `--upstream=false --filter=${linter} ${targetAbsPath}`;
    return this.RunCheck(args, targetAbsPath, resultJsonPath);
  }

  // Run 'trunk fmt' on a specified target 'targetRelativePath' with a 'linter' filter.
  async RunFmtUnit(targetRelativePath: string, linter: string): Promise<ITestResult> {
    const targetAbsPath = path.join(this.sandboxPath ?? "", targetRelativePath);
    const resultJsonPath = `${targetAbsPath}.json`;

    const args = `fmt --output-file=${resultJsonPath} --no-progress --filter=${linter} ${targetAbsPath}`;

    return this.Run(args)
      .then(({ stdout, stderr }) =>
        this.ParseRunResult(
          {
            exitCode: 0,
            stdout,
            stderr,
            outputJson: JSON.parse(fs.readFileSync(resultJsonPath, { encoding: "utf-8" })),
          },
          ITrunkVerb.Format,
          targetAbsPath
        )
      )
      .catch((error: Error) => {
        const er = error as any;
        const trunkRunResult = <ITrunkRunResult>{
          exitCode: er["code"],
          stdout: er["stdout"],
          stderr: er["stderr"],
          outputJson: JSON.parse(fs.readFileSync(resultJsonPath, { encoding: "utf-8" })),
        };
        if (trunkRunResult.exitCode != 1) {
          console.log("Failure running 'trunk fmt'");
          console.log(error);
        }
        return this.ParseRunResult(trunkRunResult, ITrunkVerb.Format, targetAbsPath);
      });
  }
}
