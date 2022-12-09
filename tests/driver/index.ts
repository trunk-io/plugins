import { exec, spawn, spawnSync, ExecOptions, execSync, execFile } from "child_process";
// import { spawn } from "node-pty";
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

const execPromise = util.promisify(exec);
const TEMP_PREFIX = "plugins_";
const ENABLE_TIMEOUT = 1000;

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
  getFullTrunkConfig = () => {
    // TODO: TYLER THIS NEEDS TO BE CWD'D
    const printConfig = execSync(`${ARGS.cliPath ?? "trunk"} config print`);
    return YAML.parse(printConfig.toString());
  };

  /**
   * Parse the result of 'getFullTrunkConfig' in the context of 'ARGS' to identify the desired linter version to enable.
   */
  extractLinterVersion = (): string => {
    // TODO: TYLER STORE THIS ON THE DRIVER
    if (!ARGS.linterVersion || ARGS.linterVersion === "Latest") {
      return "";
    } else if (ARGS.linterVersion === "KnownGoodVersion") {
      return (
        this.getFullTrunkConfig().lint.definitions.find(
          ({ name }: { name: string }) => name === this.linter
        )?.known_good_version ?? ""
      );
    } else {
      return ARGS.linterVersion;
    }
  };

  /**
   * Setup a sandbox test directory by copying in test contents and conditionally:
   * 1. Creating a git repo
   * 2. Dumping a newly generated trunk.yaml
   * 3. Enabling the specified 'linter'
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
      this.gitDriver.init();
      this.gitDriver.add(".").commit("first commit");
    }

    if (this.setupSettings.setupTrunk) {
      // Initialize trunk via config
      fs.mkdirSync(path.resolve(this.sandboxPath, ".trunk"));
      fs.writeFileSync(path.resolve(this.sandboxPath, ".trunk/trunk.yaml"), newTrunkYamlContents());
    }

    // Enable tested linter if specified
    if (!this.linter) {
      return;
    }

    const version = this.extractLinterVersion();
    const versionString = version.length > 0 ? `@${version}` : "";
    const linterVersionString = `${versionString}${this.linter}`;

    // Prefer calling enable over editing trunk.yaml directly because it also handles runtimes, etc.
    const cliCommand = ARGS.cliPath ?? "trunk";
    const args = `check enable ${linterVersionString} --monitor=false`;

    let stdout: Buffer;
    let stderr: Buffer;

    // const daemon = spawn(cliCommand, ["daemon", "launch", "--monitor=false"], { cwd: this.sandboxPath, timeout: 5000});
    // const daemon = spawn(`${cliCommand} daemon launch --monitor=false`, { cwd: this.sandboxPath });
    // daemon.stdout.on('data', (data) => {
    //   console.log(`data written ${data}`);
    //   stdout.write(data);
    // });

    // console.log("about to run check enable");

    // try {
    //   execSync(`${cliCommand} ${args}`, { cwd: this.sandboxPath });
    // } catch (er: any) {
    //   console.log(er as Error);
    //   console.log(er.stdout.toString());
    //   console.log(er.stderr.toString());
    // }

    // console.log("killing the daemon");

    // daemon.kill();

    // console.log("killed the daemon");

    //////////////////////////////////////
    // (async () => {
    //   console.log('Spawn:');

    //   const ptyProcess = spawn(cliCommand, args, { cwd: this.sandboxPath! });

    //   ptyProcess.onData((data: string) => {
    //     stdout.write(data);
    //   });

    //   const interval = setInterval(() => {
    //     ptyProcess.write('y\n');
    //   }, 1000);

    //   ptyProcess.onExit(() => {
    //     clearInterval(interval);
    //   });
    // })();

    ///////////////////////////////

    // const daemonCommand = `${ARGS.cliPath ?? "trunk"} daemon launch --monitor=false`;
    // exec(daemonCommand, { cwd: this.sandboxPath, timeout: ENABLE_TIMEOUT });
    // try {
    //   const version = this.extractLinterVersion();
    //   const versionString = version.length > 0 ? `@${version}` : "";
    //   const linterVersionString = `${versionString}${this.linter}`;

    //   // Prefer calling enable over editing trunk.yaml directly because it also handles runtimes, etc.
    //   const enableCommand = `${
    //     ARGS.cliPath ?? "trunk"
    //   } check enable ${linterVersionString} --monitor=false`;
    //   execSync(enableCommand, { cwd: this.sandboxPath });
    // } catch (error) {
    //   console.warn(`Failed to enable ${this.linter} with message ${(error as Error).message}`);
    // }

    ///////////////////

    const daemonCommand = ARGS.cliPath ?? "trunk";
    const daemonArgs = ["daemon", "launch", "--monitor=false"];

    console.log(daemonCommand);
    console.log(daemonArgs);
    // const daemonLaunch = execFile(ARGS.cliPath ?? "trunk", ["daemon", "launch", "--monitor=false"], { cwd: this.sandboxPath, shell: false }, (error, stdout, stderr) => {
    // // const daemonLaunch = execFile(daemonCommand, { cwd: this.sandboxPath, shell: false }, (error, stdout, stderr) => {
    //   console.log("completed!");
    // });
    const daemonLaunch = execFile(daemonCommand, daemonArgs, {
      cwd: this.sandboxPath,
      shell: false,
    });

    console.log(`My PID: ${daemonLaunch.pid}`);

    // daemonLaunch.on("message", (data) => {
    //   console.log(data);
    // });

    try {
      const version = this.extractLinterVersion();
      const versionString = version.length > 0 ? `@${version}` : "";
      const linterVersionString = `${versionString}${this.linter}`;

      // Prefer calling enable over editing trunk.yaml directly because it also handles runtimes, etc.
      const enableCommand = `${
        ARGS.cliPath ?? "trunk"
      } check enable ${linterVersionString} --monitor=false`;
      execSync(enableCommand, { cwd: this.sandboxPath });
    } catch (error) {
      console.warn(`Failed to enable ${this.linter} with message ${(error as Error).message}`);
    }

    console.log("about to kill");

    daemonLaunch.kill("SIGKILL");

    console.log("done killing");
  }

  /**
   * Delete the sandbox testing directory and its contents, as well as removing any trunk information
   * associated with it in order to prune the cache.
   */
  async tearDown() {
    // console.log(this.sandboxPath);
    console.log("about to deinit");
    // TODO: TYLER persistent cache dir for tests (put the cache stuff differently)
    const deinitCommand = `${ARGS.cliPath ?? "trunk"} deinit`;
    exec(deinitCommand, { cwd: this.sandboxPath, timeout: 1000 });
    if (this.sandboxPath) {
      fs.rmSync(this.sandboxPath, { recursive: true });
    }
    console.log("done deinit");
  }

  /**
   * Run a specified trunk command with `args` and additional options.
   * @param args arguments to run, excluding `trunk`
   * @param execOptions
   */
  async run(args: string, execOptions?: ExecOptions) {
    const fullCommand = `${ARGS.cliPath ?? "trunk"} ${args}`;
    return execPromise(fullCommand, { cwd: this.sandboxPath, ...execOptions, timeout: 10000 });
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

    return this.run(fullArgs)
      .then(({ stdout, stderr }) =>
        this.parseRunResult(
          {
            exitCode: 0,
            stdout,
            stderr,
            outputJson: JSON.parse(fs.readFileSync(resultJsonPath, { encoding: "utf-8" })),
          },
          "Check",
          targetAbsPath
        )
      )
      .catch((error: Error) => {
        const er = error as any;
        const trunkRunResult = <TrunkRunResult>{
          exitCode: er.code,
          stdout: er.stdout,
          stderr: er.stderr,
          outputJson: JSON.parse(fs.readFileSync(resultJsonPath, { encoding: "utf-8" })),
          error: error,
        };

        if (trunkRunResult.exitCode !== 1) {
          console.log("Failure running 'trunk check'");
          console.log(error);
        }
        return this.parseRunResult(trunkRunResult, "Check", targetAbsPath);
      });
  }

  /**
   * Run `trunk check` on a specified target `targetRelativePath` with a `linter` filter.
   * Prefer this to 'runCheck' when possible.
   */
  async runCheckUnit(targetRelativePath: string, linter: string): Promise<TestResult> {
    const targetAbsPath = path.resolve(this.sandboxPath ?? "", targetRelativePath);
    const resultJsonPath = `${targetAbsPath}.json`;
    const args = `--upstream=false --filter=${linter} ${targetAbsPath}`;
    console.log("about to  checking");
    let res = this.runCheck({ args, targetAbsPath, resultJsonPath });
    console.log("done checking");
    return res;
  }

  /**
   * Run `trunk fmt` on a specified target `targetRelativePath` with a `linter` filter.
   */
  async runFmtUnit(targetRelativePath: string, linter: string): Promise<TestResult> {
    const targetAbsPath = path.resolve(this.sandboxPath ?? "", targetRelativePath);
    const resultJsonPath = `${targetAbsPath}.json`;

    const args = `fmt --output-file=${resultJsonPath} --no-progress --filter=${linter} ${targetAbsPath}`;

    return this.run(args)
      .then(({ stdout, stderr }) =>
        this.parseRunResult(
          {
            exitCode: 0,
            stdout,
            stderr,
            outputJson: JSON.parse(fs.readFileSync(resultJsonPath, { encoding: "utf-8" })),
          },
          "Format",
          targetAbsPath
        )
      )
      .catch((error: Error) => {
        const er = error as any;
        const trunkRunResult = <TrunkRunResult>{
          exitCode: er.code,
          stdout: er.stdout,
          stderr: er.stderr,
          outputJson: JSON.parse(fs.readFileSync(resultJsonPath, { encoding: "utf-8" })),
          error: error,
        };
        if (trunkRunResult.exitCode !== 1) {
          console.log("Failure running 'trunk fmt'");
          console.log(error);
        }
        return this.parseRunResult(trunkRunResult, "Format", targetAbsPath);
      });
  }
}
