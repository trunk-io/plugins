import Debug from "debug";
import * as fs from "fs";
import path from "path";
import { SetupSettings } from "tests/driver";
import { LandingState, TrunkVerb } from "tests/types";
import { ARGS } from "tests/utils";
import { tryParseLandingState } from "tests/utils/landing_state";
import { getTrunkVersion } from "tests/utils/trunk_config";

import { GenericTrunkDriver } from "./driver";

const baseDebug = Debug("Driver");
let testNum = 1;
const linterTests = new Map<string, number>();

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

export class TrunkLintDriver extends GenericTrunkDriver {
  /** The name of the linter. If defined, enable the linter during setup. */
  linter?: string;
  /** Dictated version to enable based on logic of parsing environment variables. May be a version string or `LinterVersion` */
  toEnableVersion?: string;
  /** The version that was enabled during setup. Might still be undefined even if a linter was enabled. */
  enabledVersion?: string;

  constructor(testDir: string, setupSettings: SetupSettings, linter?: string, version?: string) {
    super(testDir, setupSettings, getDebugger(linter));
    this.linter = linter;
    this.toEnableVersion = version;
  }

  /**
   * Parse the result of 'getFullTrunkConfig' in the context of 'ARGS' to identify the desired linter version to enable.
   */
  extractLinterVersion = (): string => {
    const toEnableVersion = this.toEnableVersion ?? ARGS.linterVersion;

    if (!toEnableVersion || toEnableVersion === "Latest") {
      return "";
    } else if (toEnableVersion === "KnownGoodVersion") {
      // trunk-ignore-begin(eslint/@typescript-eslint/no-unsafe-member-access,eslint/@typescript-eslint/no-unsafe-call)
      const kgv =
        (this.getFullTrunkConfig().lint.definitions.find(
          ({ name }: { name: string }) => name === this.linter,
        )?.known_good_version as string) ?? "";
      if (this.linter === "include-what-you-use" && `${kgv}`.length === 3) {
        // TODO(Tyler): `trunk config print` does not correctly wrap quotes around kgv, so we must patch iwyu here
        return `${kgv}0`;
      }
      return kgv;
      // trunk-ignore-end(eslint/@typescript-eslint/no-unsafe-member-access,eslint/@typescript-eslint/no-unsafe-call)
    } else if (toEnableVersion !== "Snapshots") {
      // toEnableVersion is a version string
      return toEnableVersion;
    } else {
      return "";
    }
  };

  async setUp(): Promise<void> {
    await super.setUp();
    if (!this.linter || !this.sandboxPath) {
      return;
    }

    let newTrunkContents = "<undefined contents>";
    try {
      // Cast version to string in case of decimal representation (e.g. 0.40)
      const version = `${this.extractLinterVersion()}`;
      const versionString = version.length > 0 ? `@${version}` : "";
      const linterVersionString = `${this.linter}${versionString}`;
      // Prefer calling `check enable` over editing trunk.yaml directly because it also handles version, etc.
      this.debug("Enabling %s", linterVersionString);
      await this.runTrunkCmd(
        `check enable ${linterVersionString} --monitor=false --bypass-validated`,
      );

      // Retrieve the enabled version
      newTrunkContents = fs.readFileSync(
        path.resolve(this.sandboxPath, ".trunk/trunk.yaml"),
        "utf8",
      );
      const enabledVersionRegex = `(?<linter>${this.linter})@(?<version>.+)\n`;
      const foundIn = newTrunkContents.match(enabledVersionRegex);
      if (foundIn && foundIn.groups?.version && foundIn.groups?.version.length > 0) {
        this.enabledVersion = foundIn.groups.version;
        this.debug("Enabled %s", this.enabledVersion);
      }
    } catch (error) {
      console.warn(`Failed to enable ${this.linter}`, error, newTrunkContents);
    }
  }

  /**** Execution methods ****/

  /**
   * Convert a TrunkRunResult into a full TestResult.
   */
  parseRunResult(
    trunkRunResult: TrunkRunResult,
    trunkVerb: TrunkVerb,
    targetAbsPath?: string,
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
      const { stdout, stderr } = await this.runTrunkCmd(fullArgs);
      // Used for debugging only
      if (args.includes("--debug")) {
        console.log(stdout);
        console.log(stderr);
      }
      return this.parseRunResult(
        {
          exitCode: 0,
          stdout,
          stderr,
          outputJson: JSON.parse(fs.readFileSync(resultJsonPath, { encoding: "utf-8" })),
        },
        "Check",
        targetAbsPath,
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
      if (trunkRunResult.exitCode != 1) {
        console.log(`${error.code as number} Failure running 'trunk check'`, error);
      }
      // trunk-ignore-end(eslint/@typescript-eslint/no-unsafe-member-access)
      return this.parseRunResult(trunkRunResult, "Check", targetAbsPath);
    }
  }

  /**
   * Run `trunk check` on a specified target `targetRelativePath` with a `linter` filter.
   * Prefer this to 'runCheck' when possible.
   */
  async runCheckUnit(targetRelativePath: string, linter: string): Promise<TestResult> {
    const targetAbsPath = path.resolve(this.sandboxPath ?? "", targetRelativePath);
    // this has been changed from ".json" to ".out.json" for linters that run on terraform files
    // terraform extensions are .tf and .tf.json - this change prevents accidentally linting the trunk output
    const resultJsonPath = `${targetAbsPath}.out.json`;
    const args = `--upstream=false ${targetRelativePath}`;
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
      const { stdout, stderr } = await this.runTrunkCmd(fullArgs);
      // Used for debugging only
      if (args.includes("--debug")) {
        console.log(stdout);
        console.log(stderr);
      }
      return this.parseRunResult(
        {
          exitCode: 0,
          stdout,
          stderr,
          outputJson: JSON.parse(fs.readFileSync(resultJsonPath, { encoding: "utf-8" })),
        },
        "Format",
        targetAbsPath,
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
      if (trunkRunResult.exitCode != 1) {
        console.log(`${error.code as number} Failure running 'trunk fmt'`, error);
      }
      // trunk-ignore-end(eslint/@typescript-eslint/no-unsafe-member-access)
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
    const args = `--upstream=false ${targetRelativePath}`;
    this.debug("Running `trunk fmt` on %s", targetRelativePath);
    return await this.runFmt({ args, linter, targetAbsPath, resultJsonPath });
  }
}
