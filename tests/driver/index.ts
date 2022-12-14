import {
  ChildProcess,
  execFile,
  execFileSync,
  ExecOptions,
  execSync,
  spawnSync,
} from "child_process";
import Debug, { Debugger } from "debug";
import * as fs from "fs";
import * as os from "os";
import path from "path";
import * as git from "simple-git";
import { LandingState, TrunkVerb } from "tests/types";
import { ARGS } from "tests/utils";
import { tryParseLandingState } from "tests/utils/landing_state";
import { getTrunkConfig, getTrunkVersion, newTrunkYamlContents } from "tests/utils/trunk_config";
import * as util from "util";
import YAML from "yaml";

const baseDebug = Debug("Driver");
const execFilePromise = util.promisify(execFile);
const TEMP_PREFIX = "plugins_";
const MAX_DAEMON_RETRIES = 5;
let testNum = 1;
const linterTests = new Map<string, number>();

const executionEnv = () => {
  // trunk-ignore(eslint/@typescript-eslint/no-unused-vars)
  const { PWD, INIT_CWD, ...strippedEnv } = process.env;
  return {
    ...strippedEnv,
    TRUNK_DOWNLOAD_CACHE: path.resolve(
      fs.realpathSync(os.tmpdir()),
      `${TEMP_PREFIX}testing_download_cache`
    ),
  };
};

const getDebugger = (linter?: string) => {
  if (!linter) {
    // If a linter is not provided, provide a counter for easy distinction
    return baseDebug.extend(`test${testNum++}`);
  }
  const numLinterTests = linterTests.get(linter);
  const newNum = (numLinterTests ?? 0) + 1;
  linterTests.set(linter, newNum);
  return baseDebug.extend(linter).extend(`${newNum}`);
};

/**
 * A specified test target to run on, identified by a prefix.
 * `inputPath` and `outputPath` should be relative paths relative to the
 * specific linter subdirectory.
 */
export interface TestTarget {
  /** Prefix of input and output file names */
  prefix: string;
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
  cliVersion: string;
  linterVersion?: string;
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
  /** Dictated version to enable based on logic of parsing environment variables. */
  toEnableVersion?: string;
  /** The version that was enabled during setup. Might still be undefined even if a linter was enabled. */
  enabledVersion?: string;
  /** Refers to the absolute path to linter's subdir. */
  testDir: string;
  /** Created in /tmp during setup. */
  sandboxPath?: string;
  /** Created conditionally during setup. */
  gitDriver?: git.SimpleGit;
  /** What customization to use during setup. */
  setupSettings: SetupSettings;
  /** The process of the daemon, if one was created during setup. */
  daemon?: ChildProcess;
  /** A debugger for use with all this driver's operations. */
  debug: Debugger;
  /** Specifies a namespace suffix for using the same debugger pattern as the Driver. */
  debugNamespace: string;

  constructor(testDir: string, setupSettings: SetupSettings, linter?: string, version?: string) {
    this.linter = linter;
    this.toEnableVersion = version;
    this.testDir = testDir;
    this.setupSettings = setupSettings;
    this.debug = getDebugger(linter);
    this.debugNamespace = this.debug.namespace.replace("Driver:", "");
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
      success: [0, 1].includes(trunkRunResult.exitCode),
      trunkRunResult,
      trunkVerb,
      targetPath: targetAbsPath,
      landingState: tryParseLandingState(this.testDir, trunkRunResult.outputJson),
      cliVersion: getTrunkVersion(),
      linterVersion: this.enabledVersion,
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
    if (this.toEnableVersion) {
      return this.toEnableVersion;
    } else if (!ARGS.linterVersion || ARGS.linterVersion === "Latest") {
      return "";
    } else if (ARGS.linterVersion === "KnownGoodVersion") {
      // TODO(Tyler): Add fallback to use lint.downloads.version to match trunk fallback behavior.
      // trunk-ignore-begin(eslint/@typescript-eslint/no-unsafe-member-access,eslint/@typescript-eslint/no-unsafe-call)
      return (
        (this.getFullTrunkConfig().lint.definitions.find(
          ({ name }: { name: string }) => name === this.linter
        )?.known_good_version as string) ?? ""
      );
      // trunk-ignore-end(eslint/@typescript-eslint/no-unsafe-member-access,eslint/@typescript-eslint/no-unsafe-call)
    } else if (ARGS.linterVersion !== "Snapshots") {
      return ARGS.linterVersion;
    } else {
      return "";
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
    this.sandboxPath = fs.realpathSync(fs.mkdtempSync(path.resolve(os.tmpdir(), TEMP_PREFIX)));
    this.debug("Created sandbox path %s from %s", this.sandboxPath, this.testDir);
    if (!this.sandboxPath) {
      return;
    }
    // Create repo
    fs.cpSync(this.testDir, this.sandboxPath, { recursive: true });

    this.gitDriver = git.simpleGit(this.sandboxPath);
    if (this.setupSettings.setupGit) {
      await this.gitDriver
        .init({ "--initial-branch": "main" })
        .add(".")
        .addConfig("user.name", "Plugin Author")
        .addConfig("user.email", "trunk-plugins@example.com")
        .addConfig("commit.gpgsign", "false")
        .commit("first commit");
    }

    if (this.setupSettings.setupTrunk) {
      // Initialize trunk via config
      if (!fs.existsSync(path.resolve(path.resolve(this.sandboxPath, ".trunk")))) {
        fs.mkdirSync(path.resolve(this.sandboxPath, ".trunk"), {});
      }
      fs.writeFileSync(path.resolve(this.sandboxPath, ".trunk/trunk.yaml"), newTrunkYamlContents());
    }

    // Run a cli-dependent command to wait on and verify trunk is installed
    // (Run this regardless of setup requirements. Trunk should be in the path)
    await this.run("--help");

    // Launch daemon if specified
    if (!this.setupSettings.launchDaemon) {
      return;
    }
    await this.launchDaemonAsync();
    this.debug("Launched daemon");

    // Enable tested linter if specified
    if (!this.linter) {
      return;
    }

    try {
      const version = this.extractLinterVersion();
      const versionString = version.length > 0 ? `@${version}` : "";
      const linterVersionString = `${this.linter}${versionString}`;
      // Prefer calling `check enable` over editing trunk.yaml directly because it also handles version, etc.
      this.debug("Enabling %s", linterVersionString);
      await this.run(`check enable ${linterVersionString} --monitor=false`);

      // Retrieve the enabled version
      const newTrunkContents = fs.readFileSync(
        path.resolve(this.sandboxPath, ".trunk/trunk.yaml"),
        "utf8"
      );
      const enabledVersionRegex = `(?<linter>${this.linter})@(?<version>.+)\n$`;
      const foundIn = newTrunkContents.match(enabledVersionRegex);
      if (foundIn && foundIn.groups?.version && foundIn.groups?.version.length > 0) {
        this.enabledVersion = foundIn.groups.version;
        this.debug("Enabled %s", this.enabledVersion);
      }
    } catch (error) {
      console.warn(`Failed to enable ${this.linter}`, error);
    }
  }

  /**
   * Delete the sandbox testing directory and its contents, as well as removing any trunk information
   * associated with it in order to prune the cache.
   */
  tearDown() {
    this.debug("Cleaning up %s", this.sandboxPath);
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
      env: executionEnv(),
      ...execOptions,
    });
  }

  /**
   * Launch the daemon (during setup). This is required to verify parallelism
   * works as intended.
   */
  async launchDaemonAsync() {
    const trunkCommand = ARGS.cliPath ?? "trunk";
    const daemonArgs = ["daemon", "launch", "--monitor=false"];
    this.daemon = execFile(trunkCommand, daemonArgs, {
      cwd: this.sandboxPath,
      env: executionEnv(),
    });

    // Verify the daemon has finished launching
    for (let i = 0; i < MAX_DAEMON_RETRIES; i++) {
      const status = spawnSync(trunkCommand, ["daemon", "status"], { cwd: this.sandboxPath });
      if (!status.error) {
        return;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    console.log("Failed to confirm daemon status");
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
    const fullArgs = `check -n --output-file=${resultJsonPath} --no-progress --ignore-git-state ${args}`;
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
      // If critical failure occurs, JSON file might be empty
      let jsonContents = fs.readFileSync(resultJsonPath, { encoding: "utf-8" });
      if (!jsonContents) {
        jsonContents = "{}";
        console.log(error.stdout as string);
        console.log(error.stderr as string);
      }

      const trunkRunResult: TrunkRunResult = {
        exitCode: error.code as number,
        stdout: error.stdout as string,
        stderr: error.stderr as string,
        outputJson: JSON.parse(jsonContents),
        error: error as Error,
      };
      // trunk-ignore-end(eslint/@typescript-eslint/no-unsafe-member-access)
      if (trunkRunResult.exitCode != 1) {
        console.log("Failure running 'trunk check'", error);
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
    this.debug("Running `trunk check` on %s", targetRelativePath);
    return await this.runCheck({ args, targetAbsPath, resultJsonPath });
  }

  /**
   * Run `trunk fmt` on a specified target `targetRelativePath` with a `linter` filter.
   */
  async runFmtUnit(targetRelativePath: string, linter: string): Promise<TestResult> {
    const targetAbsPath = path.resolve(this.sandboxPath ?? "", targetRelativePath);
    const resultJsonPath = `${targetAbsPath}.json`;

    const args = `fmt --output-file=${resultJsonPath} --no-progress --ignore-git-state --filter=${linter} ${targetAbsPath}`;

    try {
      this.debug("Running `trunk fmt` on %s", targetRelativePath);
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
      // If critical failure occurs, JSON file might be empty
      let jsonContents = fs.readFileSync(resultJsonPath, { encoding: "utf-8" });
      if (!jsonContents) {
        jsonContents = "{}";
        console.log(error.stdout as string);
        console.log(error.stderr as string);
      }

      const trunkRunResult: TrunkRunResult = {
        exitCode: error.code as number,
        stdout: error.stdout as string,
        stderr: error.stderr as string,
        outputJson: JSON.parse(jsonContents),
        error: error as Error,
      };
      // trunk-ignore-end(eslint/@typescript-eslint/no-unsafe-member-access)
      if (trunkRunResult.exitCode != 1) {
        console.log("Failure running 'trunk fmt'", error);
      }
      return this.parseRunResult(trunkRunResult, "Format", targetAbsPath);
    }
  }

  getTrunkConfig = (): any => {
    if (this.sandboxPath) {
      return getTrunkConfig(this.sandboxPath);
    }
  };
}
