import { ChildProcess, execFile, execFileSync, ExecOptions, execSync } from "child_process";
import Debug, { Debugger } from "debug";
import * as fs from "fs";
import * as os from "os";
import path from "path";
import * as git from "simple-git";
import { LandingState, TrunkVerb } from "tests/types";
import { ARGS, REPO_ROOT } from "tests/utils";
import { tryParseLandingState } from "tests/utils/landing_state";
import { getTrunkConfig, getTrunkVersion, newTrunkYamlContents } from "tests/utils/trunk_config";
import * as util from "util";
import YAML from "yaml";

const baseDebug = Debug("Driver");
const execFilePromise = util.promisify(execFile);
const TEMP_PREFIX = "plugins_";
const TEMP_SUBDIR = "tmp";
const UNINITIALIZED_ERROR = `You have attempted to modify the sandbox before it was created.
Please call this method after setup has been called.`;
let testNum = 1;
const linterTests = new Map<string, number>();

const executionEnv = (sandbox: string) => {
  // trunk-ignore(eslint/@typescript-eslint/no-unused-vars)
  const { PWD, INIT_CWD, ...strippedEnv } = process.env;
  return {
    ...strippedEnv,
    // This keeps test downloads separate from manual trunk invocations
    TRUNK_DOWNLOAD_CACHE: path.resolve(
      fs.realpathSync(os.tmpdir()),
      `${TEMP_PREFIX}testing_download_cache`
    ),
    // This is necessary to prevent launcher collision of non-atomic operations
    TMPDIR: path.resolve(sandbox, TEMP_SUBDIR),
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
}

/**
 * The primary means for setting up and running trunk commands in a test.
 * Offers helper methods for configuring a sandbox testing environment. Each test's TrunkDriver should be independent.
 */
export class TrunkDriver {
  /** The name of the linter. If defined, enable the linter during setup. */
  linter?: string;
  /** Dictated version to enable based on logic of parsing environment variables. May be a version string or `LinterVersion` */
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

  /**** Test setup/teardown methods ****/

  /**
   * Setup a sandbox test directory by copying in test contents and conditionally:
   * 1. Creating a git repo
   * 2. Dumping a newly generated trunk.yaml
   * 3. Enabling the specified 'linter'
   */
  async setUp() {
    this.sandboxPath = fs.realpathSync(fs.mkdtempSync(path.resolve(os.tmpdir(), TEMP_PREFIX)));
    this.debug("Created sandbox path %s from %s", this.sandboxPath, this.testDir);
    if (!this.sandboxPath) {
      return;
    }
    // Create repo. Don't copy snapshot files
    const snapshotFilter = (file: string) => !file.endsWith(".shot");
    fs.cpSync(this.testDir, this.sandboxPath, { recursive: true, filter: snapshotFilter });

    if (this.setupSettings.setupTrunk) {
      // Initialize trunk via config
      if (!fs.existsSync(path.resolve(path.resolve(this.sandboxPath, ".trunk")))) {
        fs.mkdirSync(path.resolve(this.sandboxPath, ".trunk"), {});
      }
      fs.writeFileSync(path.resolve(this.sandboxPath, ".trunk/trunk.yaml"), newTrunkYamlContents());
    }

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

    // Run a cli-dependent command to wait on and verify trunk is installed
    try {
      // This directory is generated during launcher log creation and is required for binary cache results
      fs.mkdirSync(path.resolve(this.sandboxPath, TEMP_SUBDIR));
      await this.run("--help");
    } catch (error) {
      // The trunk launcher is not designed to handle concurrent installs.
      // This command may fail if another test installs at the same time.
      // Don't block if this happens.
      console.warn(`Error running --help`, error);
    }

    // Enable tested linter if specified
    if (!this.linter) {
      return;
    }

    try {
      // Cast version to string in case of decimal representation (e.g. 0.40)
      const version = `${this.extractLinterVersion()}`;
      const versionString = version.length > 0 ? `@${version}` : "";
      const linterVersionString = `${this.linter}${versionString}`;
      // Prefer calling `check enable` over editing trunk.yaml directly because it also handles version, etc.
      this.debug("Enabling %s", linterVersionString);
      await this.run(`check enable ${linterVersionString} --monitor=false --bypass-validated`);

      // Retrieve the enabled version
      const newTrunkContents = fs.readFileSync(
        path.resolve(this.sandboxPath, ".trunk/trunk.yaml"),
        "utf8"
      );
      const enabledVersionRegex = `(?<linter>${this.linter})@(?<version>.+)\n`;
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

    // Preserve test directory if `SANDBOX_DEBUG` is truthy.
    if (ARGS.sandboxDebug) {
      execFileSync(trunkCommand, ["daemon", "shutdown"], {
        cwd: this.sandboxPath,
        env: executionEnv(this.getSandbox()),
      });
      console.log(`Preserving test dir ${this.getSandbox()} for linter ${this.linter ?? "N/A"}`);
      return;
    }

    execFileSync(trunkCommand, ["deinit"], {
      cwd: this.sandboxPath,
      env: executionEnv(this.getSandbox()),
    });

    if (this.sandboxPath) {
      fs.rmSync(this.sandboxPath, { recursive: true });
    }
  }

  /**** Repository file manipulation ****/

  /**
   * Returns the generated sandboxPath for this test. Throws if setup has not yet been called.
   */
  getSandbox(): string {
    if (!this.sandboxPath) {
      throw new Error(UNINITIALIZED_ERROR);
    }
    return this.sandboxPath;
  }

  /**
   * Reads the contents of the file at `relPath`, relative to the sandbox root.
   */
  readFile(relPath: string): string {
    const sandboxPath = this.getSandbox();
    const targetPath = path.resolve(sandboxPath, relPath);
    return fs.readFileSync(targetPath, "utf8");
  }

  /**
   * Writes `contents` to a file with at the `relPath`, relative to the sandbox root.
   * Recursively create its parent directory if it does not exist.
   */
  writeFile(relPath: string, contents: string) {
    const sandboxPath = this.getSandbox();
    const destPath = path.resolve(sandboxPath, relPath);
    const destDir = path.parse(destPath).dir;
    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(destPath, contents);
  }

  /**
   * Copies a file at the `relPath` inside the repository root to the same relative path in the sandbox root.
   * Recursively creates its parent directory if it does not exist.
   */
  copyFileFromRoot(relPath: string) {
    const sandboxPath = this.getSandbox();
    const sourcePath = path.resolve(REPO_ROOT, relPath);
    const destPath = path.resolve(sandboxPath, relPath);
    const destDir = path.parse(destPath).dir;
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(sourcePath, destPath);
  }

  /**
   * Moves/renames a file at from the `sourceRelPath` inside the sandbox to the `destRelPath`.
   * Recursively creates the destination's parent directory if it does not exist.
   */
  moveFile(sourceRelPath: string, destRelPath: string) {
    const sandboxPath = this.getSandbox();
    const sourcePath = path.resolve(sandboxPath, sourceRelPath);
    const destPath = path.resolve(sandboxPath, destRelPath);
    const destDir = path.parse(destPath).dir;
    fs.mkdirSync(destDir, { recursive: true });
    fs.renameSync(sourcePath, destPath);
  }

  /**
   * Copies a file at from the `sourceRelPath` inside the sandbox to the `destRelPath`.
   * Recursively creates the destination's parent directory if it does not exist.
   */
  copyFile(sourceRelPath: string, destRelPath: string) {
    const sandboxPath = this.getSandbox();
    const sourcePath = path.resolve(sandboxPath, sourceRelPath);
    const destPath = path.resolve(sandboxPath, destRelPath);
    const destDir = path.parse(destPath).dir;
    fs.mkdirSync(destDir, { recursive: true });
    fs.cpSync(sourcePath, destPath);
  }

  /**
   * Deletes a file at the `relPath` inside the sandbox root.
   */
  deleteFile(relPath: string) {
    const sandboxPath = this.getSandbox();
    const targetPath = path.resolve(sandboxPath, relPath);
    fs.rmSync(targetPath, { recursive: true });
  }

  /**** Trunk config methods ****/

  /**
   * Return the yaml result of parsing the sandbox's .trunk/trunk.yaml file.
   */
  getTrunkConfig = (): any => {
    if (this.sandboxPath) {
      return getTrunkConfig(this.sandboxPath);
    }
  };

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
    const toEnableVersion = this.toEnableVersion ?? ARGS.linterVersion;

    if (!toEnableVersion || toEnableVersion === "Latest") {
      return "";
    } else if (toEnableVersion === "KnownGoodVersion") {
      // TODO(Tyler): Add fallback to use lint.downloads.version to match trunk fallback behavior.
      // trunk-ignore-begin(eslint/@typescript-eslint/no-unsafe-member-access,eslint/@typescript-eslint/no-unsafe-call)
      return (
        (this.getFullTrunkConfig().lint.definitions.find(
          ({ name }: { name: string }) => name === this.linter
        )?.known_good_version as string) ?? ""
      );
      // trunk-ignore-end(eslint/@typescript-eslint/no-unsafe-member-access,eslint/@typescript-eslint/no-unsafe-call)
    } else if (toEnableVersion !== "Snapshots") {
      // toEnableVersion is a version string
      return toEnableVersion;
    } else {
      return "";
    }
  };

  /**** Execution methods ****/

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
      landingState: tryParseLandingState(this.getSandbox(), trunkRunResult.outputJson),
      cliVersion: getTrunkVersion(),
      linterVersion: this.enabledVersion,
    };
  }

  /**
   * Run a specified trunk command with `args` and additional options.
   * @param args arguments to run, excluding `trunk`
   * @param execOptions
   */
  async run(args: string, execOptions?: ExecOptions) {
    const trunkPath = ARGS.cliPath ?? "trunk";
    return await execFilePromise(trunkPath, args.split(" ").filter(Boolean), {
      cwd: this.sandboxPath,
      env: executionEnv(this.sandboxPath ?? ""),
      ...execOptions,
    });
  }

  /**
   * Run a `trunk check` command with additional options.
   * Prefer using `runCheckUnit` unless you don't want to run on a specified target.
   * @param args arguments to append in addition to the boilerplate args/options
   * @param linter optional linter to filter run
   * @param targetAbsPath optional absolute path to a target to run check against (recorded for debugging)
   * @param resultJsonPath where to write the JSON result to
   */
  async runCheck({
    args = "",
    linter,
    targetAbsPath,
    resultJsonPath = path.resolve(this.sandboxPath ?? "", "result.json"),
  }: {
    args?: string;
    linter?: string;
    targetAbsPath?: string;
    resultJsonPath?: string;
  }) {
    // Note that args "prefer last", so specifying options like `-y` are still viable.
    const linterFilter = linter ? `--filter=${linter}` : "";
    const fullArgs = `check -n --output-file=${resultJsonPath} --no-progress --ignore-git-state ${linterFilter} ${args}`;
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
    const args = `--upstream=false ${targetAbsPath}`;
    this.debug("Running `trunk check` on %s", targetRelativePath);
    return await this.runCheck({ args, linter, targetAbsPath, resultJsonPath });
  }

  /**
   * Run a `trunk fmt` command with additional options.
   * Prefer using `runFmtUnit` unless you don't want to run on a specified target.
   * @param args arguments to append in addition to the boilerplate args/options
   * @param linter optional linter to filter run
   * @param targetAbsPath optional absolute path to a target to run check against (recorded for debugging)
   * @param resultJsonPath where to write the JSON result to
   */
  async runFmt({
    args = "",
    linter,
    targetAbsPath,
    resultJsonPath = path.resolve(this.sandboxPath ?? "", "result.json"),
  }: {
    args?: string;
    linter?: string;
    targetAbsPath?: string;
    resultJsonPath?: string;
  }) {
    const linterFilter = linter ? `--filter=${linter}` : "";
    const fullArgs = `fmt --output-file=${resultJsonPath} --no-progress --ignore-git-state ${linterFilter} ${args}`;

    try {
      const { stdout, stderr } = await this.run(fullArgs);
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

  /**
   * Run `trunk fmt` on a specified target `targetRelativePath` with a `linter` filter.
   * Prefer this to 'runFmt' when possible.
   */
  async runFmtUnit(targetRelativePath: string, linter: string): Promise<TestResult> {
    const targetAbsPath = path.resolve(this.sandboxPath ?? "", targetRelativePath);
    const resultJsonPath = `${targetAbsPath}.json`;
    const args = `--upstream=false ${targetAbsPath}`;
    this.debug("Running `trunk fmt` on %s", targetRelativePath);
    return await this.runFmt({ args, linter, targetAbsPath, resultJsonPath });
  }
}
