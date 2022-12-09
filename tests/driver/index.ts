import { ChildProcess, execFile, execFileSync, ExecOptions, execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import path from "path";
import * as git from "simple-git";
import { LandingState, TrunkVerb } from "tests/types";
import { ARGS } from "tests/utils";
import { tryParseLandingState } from "tests/utils/landing_state";
import { newTrunkYamlContents } from "tests/utils/trunk_config";
import * as util from "util";
import YAML from "yaml";

const execFilePromise = util.promisify(execFile);
const TEMP_PREFIX = "plugins_";

/**
 * A specified test target to run on, identified by a prefix.
 * `inputPath` and `outputPath` should be relative paths relative to the
 * specific linter subdirectory.
 */
export interface TestTarget {
  /** Prefix of input and output file names */
  prefix: string;
  /** Relative path to output file from specific linter subdirectory */
  outputPath: string;
  /** Relative path to input file from specific linter subdirectory */
  inputPath: string;
}

/**
 * The result of running a 'trunk check' or 'trunk fmt' command.
 */
export interface TrunkRunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  /** Error thrown if the trunk invocation returned a nonzero exit code */
  error?: Error;
  /** Attempt to parse the JSON file passed to --output-file */
  outputJson: unknown;
}

/**
 * The result of all invocations run during an individual test. This includes
 * additional information parsed from the resulting json if successful.
 */
export interface TestResult {
  success: boolean;
  trunkRunResult: TrunkRunResult;
  trunkVerb: TrunkVerb;
  /** Absolute path to the target of the `trunk check`/`trunk fmt` run, if one was specified. */
  targetPath?: string;
  /** Attempt at parsing the outputJson and extracting only relevant information. */
  landingState?: LandingState;
}

/**
 * Configuration for when a TrunkDriver instance runs `setUp`.
 */
export interface SetupSettings {
  /** Whether or not to run `git init` and attach a gitDriver. */
  setupGit?: boolean;
  /** Whether or not to create a new .trunk/trunk.yaml */
  setupTrunk?: boolean;
  /** Whether or not to launch the daemon on setup. */
  launchDaemon?: boolean;
}

/**
 * The primary means for setting up and running trunk commands in a test.
 */
export class TrunkDriver {
  /** The name of the linter. If defined, enable the linter during setup. */
  linter?: string;
  /** Refers to the absolute path to the repo's test subdir inside a linter directory. */
  testDir: string;
  /** Created in /tmp during setup. */
  sandboxPath?: string;
  /** Created conditionally during setup. */
  gitDriver?: git.SimpleGit;
  /** What customization to use during setup. */
  setupSettings: SetupSettings;

  daemon?: ChildProcess;

  constructor(testDir: string, setupSettings: SetupSettings, linter?: string) {
    this.linter = linter;
    this.testDir = testDir;
    this.setupSettings = setupSettings;
  }

  /**
   * Convert a TrunkRunResult into a full TestResult.
   */
  parseRunResult(
    trunkRunResult: TrunkRunResult,
    trunkVerb: TrunkVerb,
    targetAbsPath?: string
  ): TestResult {
    return {
      success: [0, 1].includes(trunkRunResult.exitCode) && trunkRunResult.stderr.length === 0,
      trunkRunResult,
      trunkVerb,
      targetPath: targetAbsPath,
      landingState: tryParseLandingState(this.testDir, trunkRunResult.outputJson),
    };
  }

  /**
   * Return the yaml result of parsing the output of `trunk config print` in the test sandbox.
   */
  getFullTrunkConfig = (): any => {
    const printConfig = execSync(`${ARGS.cliPath ?? "trunk"} config print`, {
      cwd: this.sandboxPath,
    });
    return YAML.parse(printConfig.toString());
  };

  /**
   * Parse the result of 'getFullTrunkConfig' in the context of 'ARGS' to identify the desired linter version to enable.
   */
  extractLinterVersion = (): string => {
    if (!ARGS.linterVersion || ARGS.linterVersion === "Latest") {
      return "";
    } else if (ARGS.linterVersion === "KnownGoodVersion") {
      // trunk-ignore-begin(eslint/@typescript-eslint/no-unsafe-member-access,eslint/@typescript-eslint/no-unsafe-call)
      return (
        (this.getFullTrunkConfig().lint.definitions.find(
          ({ name }: { name: string }) => name === this.linter
        )?.known_good_version as string) ?? ""
      );
      // trunk-ignore-end(eslint/@typescript-eslint/no-unsafe-member-access,eslint/@typescript-eslint/no-unsafe-call)
    } else {
      return ARGS.linterVersion;
    }
  };

  /**
   * Setup a sandbox test directory by copying in test contents and conditionally:
   * 1. Creating a git repo
   * 2. Dumping a newly generated trunk.yaml
   * 3. Launching the daemon
   * 4. Enabling the specified 'linter'
   */
  async setUp() {
    this.sandboxPath = fs.mkdtempSync(path.resolve(os.tmpdir(), TEMP_PREFIX));
    if (!this.sandboxPath) {
      return;
    }
    // Create repo
    const sourceDir = path.resolve(this.testDir, "..");
    fs.cpSync(sourceDir, this.sandboxPath, { recursive: true });

    if (this.setupSettings.setupGit) {
      this.gitDriver = git.simpleGit(this.sandboxPath);
      await this.gitDriver
        .init()
        .add(".")
        .addConfig("user.name", "Plugin Author")
        .addConfig("user.email", "trunk-plugins@example.com")
        .commit("first commit");
    }

    if (this.setupSettings.setupTrunk) {
      // Initialize trunk via config
      fs.mkdirSync(path.resolve(this.sandboxPath, ".trunk"));
      fs.writeFileSync(path.resolve(this.sandboxPath, ".trunk/trunk.yaml"), newTrunkYamlContents());
    }

    // Launch daemon if specified
    if (!this.setupSettings.launchDaemon) {
      return;
    }

    // Prefer calling enable over editing trunk.yaml directly because it also handles runtimes, etc.
    const trunkCommand = ARGS.cliPath ?? "trunk";
    const daemonArgs = ["daemon", "launch", "--monitor=false"];

    this.daemon = execFile(trunkCommand, daemonArgs, {
      cwd: this.sandboxPath,
    });

    // Enable tested linter if specified
    if (!this.linter) {
      return;
    }

    try {
      const version = this.extractLinterVersion();
      const versionString = version.length > 0 ? `@${version}` : "";
      const linterVersionString = `${versionString}${this.linter}`;
      // Prefer calling `check enable` over editing trunk.yaml directly because it also handles runtimes, etc.
      await this.run(`check enable ${linterVersionString} --monitor=false`);
    } catch (error) {
      console.warn(`Failed to enable ${this.linter} with message ${(error as Error).message}`);
      console.warn(error);
    }
  }

  /**
   * Delete the sandbox testing directory and its contents, as well as removing any trunk information
   * associated with it in order to prune the cache.
   */
  tearDown() {
    // TODO(Tyler): Use persistent test cache dir and call `this.daemon?.kill("SIGKILL")` instead of deinit.
    const trunkCommand = ARGS.cliPath ?? "trunk";
    execFileSync(trunkCommand, ["deinit"], { cwd: this.sandboxPath });
    if (this.sandboxPath) {
      fs.rmSync(this.sandboxPath, { recursive: true });
    }
  }

  /**
   * Run a specified trunk command with `args` and additional options.
   * @param args arguments to run, excluding `trunk`
   * @param execOptions
   */
  async run(args: string, execOptions?: ExecOptions) {
    const trunkPath = ARGS.cliPath ?? "trunk";
    return await execFilePromise(trunkPath, args.split(" "), {
      cwd: this.sandboxPath,
      ...execOptions,
    });
  }

  /**
   * Run a `trunk check` command with additional options.
   * Prefer using runCheckUnit unless you don't want to run on a specified target.
   * @param args arguments to append in addition to the boilerplate args/options
   * @param targetAbsPath optional absolute path to a target to run check against
   * @param resultJsonPath where to write the JSON result to
   */
  async runCheck({
    args = "",
    targetAbsPath,
    resultJsonPath = path.resolve(this.sandboxPath ?? "", "result.json"),
  }: {
    args?: string;
    targetAbsPath?: string;
    resultJsonPath?: string;
  }) {
    const fullArgs = `check -n --output-file=${resultJsonPath} --no-progress ${args}`;
    try {
      const { stdout, stderr } = await this.run(fullArgs);
      return this.parseRunResult(
        {
          exitCode: 0,
          stdout,
          stderr,
          outputJson: JSON.parse(fs.readFileSync(resultJsonPath, { encoding: "utf-8" })),
        },
        "Check",
        targetAbsPath
      );
    } catch (error: any) {
      // trunk-ignore-begin(eslint/@typescript-eslint/no-unsafe-member-access)
      const trunkRunResult = <TrunkRunResult>{
        exitCode: error.code as number,
        stdout: error.stdout as string,
        stderr: error.stderr as string,
        outputJson: JSON.parse(fs.readFileSync(resultJsonPath, { encoding: "utf-8" })),
        error: error as Error,
      };
      // trunk-ignore-end(eslint/@typescript-eslint/no-unsafe-member-access)
      if (trunkRunResult.exitCode != 1) {
        console.log("Failure running 'trunk check'");
        console.log(error);
      }
      return this.parseRunResult(trunkRunResult, "Check", targetAbsPath);
    }
  }

  /**
   * Run `trunk check` on a specified target `targetRelativePath` with a `linter` filter.
   * Prefer this to 'runCheck' when possible.
   */
  async runCheckUnit(targetRelativePath: string, linter: string): Promise<TestResult> {
    const targetAbsPath = path.resolve(this.sandboxPath ?? "", targetRelativePath);
    const resultJsonPath = `${targetAbsPath}.json`;
    const args = `--upstream=false --filter=${linter} ${targetAbsPath}`;
    return await this.runCheck({ args, targetAbsPath, resultJsonPath });
  }

  /**
   * Run `trunk fmt` on a specified target `targetRelativePath` with a `linter` filter.
   */
  async runFmtUnit(targetRelativePath: string, linter: string): Promise<TestResult> {
    const targetAbsPath = path.resolve(this.sandboxPath ?? "", targetRelativePath);
    const resultJsonPath = `${targetAbsPath}.json`;

    const args = `fmt --output-file=${resultJsonPath} --no-progress --filter=${linter} ${targetAbsPath}`;

    try {
      const { stdout, stderr } = await this.run(args);
      return this.parseRunResult(
        {
          exitCode: 0,
          stdout,
          stderr,
          outputJson: JSON.parse(fs.readFileSync(resultJsonPath, { encoding: "utf-8" })),
        },
        "Format",
        targetAbsPath
      );
    } catch (error: any) {
      // trunk-ignore-begin(eslint/@typescript-eslint/no-unsafe-member-access)
      const trunkRunResult = <TrunkRunResult>{
        exitCode: error.code as number,
        stdout: error.stdout as string,
        stderr: error.stderr as string,
        outputJson: JSON.parse(fs.readFileSync(resultJsonPath, { encoding: "utf-8" })),
        error: error as Error,
      };
      // trunk-ignore-end(eslint/@typescript-eslint/no-unsafe-member-access)
      if (trunkRunResult.exitCode != 1) {
        console.log("Failure running 'trunk fmt'");
        console.log(error);
      }
      return this.parseRunResult(trunkRunResult, "Format", targetAbsPath);
    }
  }
}
