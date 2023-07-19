import Debug from "debug";
import * as fs from "fs";
import path from "path";
import { SetupSettings } from "tests/driver";
import { ARGS } from "tests/utils";

import { GenericTrunkDriver } from "./driver";

const baseDebug = Debug("Driver");

let testNum = 1;
const toolTests = new Map<string, number>();

const getDebugger = (tool?: string) => {
  if (!tool) {
    // If a tool is not provided, provide a counter for easy distinction
    return baseDebug.extend(`test${testNum++}`);
  }
  const numToolTests = toolTests.get(tool);
  const newNum = (numToolTests ?? 0) + 1;
  toolTests.set(tool, newNum);
  return baseDebug.extend(tool).extend(`${newNum}`);
};

/**
 * The result of running a 'trunk check' or 'trunk fmt' command.
 */
export interface TrunkToolRunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  /** Error thrown if the trunk invocation returned a nonzero exit code */
  error?: Error;
}

export class TrunkToolDriver extends GenericTrunkDriver {
  /** The name of the tool. If defined, enable the tool during setup. */
  tool?: string;
  /** Dictated version to enable based on logic of parsing environment variables. May be a version string or `ToolVersion` */
  toEnableVersion?: string;
  /** The version that was enabled during setup. Might still be undefined even if a tool was enabled. */
  enabledVersion?: string;

  constructor(testDir: string, setupSettings: SetupSettings, tool?: string, version?: string) {
    super(testDir, setupSettings, getDebugger(tool));
    this.tool = tool;
    this.toEnableVersion = version;
  }

  /**
   * Setup a sandbox test directory by copying in test contents and conditionally:
   * 1. Creating a git repo
   * 2. Dumping a newly generated trunk.yaml
   * 3. Enabling the specified 'tool'
   * 4. Sync to make sure it's available
   */
  async setUp() {
    await super.setUp();

    // Enable tested tool if specified
    if (!this.tool || !this.sandboxPath) {
      return;
    }
    try {
      // Cast version to string in case of decimal representation (e.g. 0.40)
      const version = `${this.extractToolVersion()}`;
      const versionString = version.length > 0 ? `@${version}` : "";
      const toolVersionString = `${this.tool}${versionString}`;
      // Prefer calling `tools enable` over editing trunk.yaml directly because it also handles version, etc.
      this.debug("Enabling %s", toolVersionString);
      await this.runTrunk(["tools", "enable", toolVersionString]);

      // Retrieve the enabled version
      const newTrunkContents = fs.readFileSync(
        path.resolve(this.sandboxPath, ".trunk/trunk.yaml"),
        "utf8",
      );
      const enabledVersionRegex = `(?<tool>${this.tool})@(?<version>.+)\n`;
      const foundIn = newTrunkContents.match(enabledVersionRegex);
      if (foundIn && foundIn.groups?.version && foundIn.groups?.version.length > 0) {
        this.enabledVersion = foundIn.groups.version;
        this.debug("Enabled %s", this.enabledVersion);
      }

      // Sync the tool to ensure it's available
      await this.runTrunk(["tools", "install"]);
      if (!fs.existsSync(path.resolve(this.sandboxPath, ".trunk", "tools", this.tool))) {
        throw new Error(`Failed to install ${this.tool}`);
      }
    } catch (error) {
      console.warn(`Failed to enable ${this.tool}`, error);
    }
  }

  /**
   * Parse the result of 'getFullTrunkConfig' in the context of 'ARGS' to identify the desired tool version to enable.
   */
  extractToolVersion = (): string => {
    const toEnableVersion = this.toEnableVersion ?? ARGS.linterVersion;

    if (!toEnableVersion || toEnableVersion === "Latest") {
      return "";
    } else if (toEnableVersion === "KnownGoodVersion") {
      // TODO(Tyler): Add fallback to use lint.downloads.version to match trunk fallback behavior.
      // trunk-ignore-begin(eslint/@typescript-eslint/no-unsafe-member-access,eslint/@typescript-eslint/no-unsafe-call)
      return (
        (this.getFullTrunkConfig().tool.definitions.find(
          ({ name }: { name: string }) => name === this.tool,
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

  async runTool(command: string[]): Promise<TrunkToolRunResult> {
    try {
      const { stdout, stderr } = await this.run(`.trunk/tools/${command[0]}`, command.slice(1));
      return {
        exitCode: 0,
        stdout,
        stderr,
      };
    } catch (e: any) {
      console.log(e);
      // trunk-ignore-begin(eslint/@typescript-eslint/no-unsafe-member-access)
      return {
        exitCode: e.code as number,
        stdout: e.stdout as string,
        stderr: e.stderr as string,
      };
      // trunk-ignore-end(eslint/@typescript-eslint/no-unsafe-member-access)
    }
  }
}
