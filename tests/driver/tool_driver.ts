import Debug from "debug";
import * as fs from "fs";
import path from "path";
import { GenericTrunkDriver, SetupSettings } from "tests/driver/driver";
import { ARGS, REPO_ROOT } from "tests/utils";
import { getTrunkVersion } from "tests/utils/trunk_config";

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
 * The result of invoking a tool.
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

  getTrunkYamlContents(trunkVersion: string | undefined): string {
    return `version: 0.1
cli:
  version: ${trunkVersion ?? getTrunkVersion()}
plugins:
  sources:
  - id: trunk
    local: ${REPO_ROOT}
lint:
  ignore:
    - linters: [ALL]
      paths:
        - tmp/**
        - node_modules/**
        - .trunk/configs/**
        - .gitattributes
`;
  }

  async setUpWithInstall() {
    await this.setUp();
    await this.installTool();
  }

  /**
   * Setup a sandbox test directory by copying in test contents and conditionally:
   * 1. Creating a git repo
   * 2. Dumping a newly generated trunk.yaml
   * 3. Enabling the specified 'tool'
   */
  async setUp() {
    await super.setUp();

    // Enable tested tool if specified
    if (!this.tool || !this.sandboxPath) {
      return;
    }
    try {
      // trunk-ignore(eslint/@typescript-eslint/no-unnecessary-template-expression): Cast to string to handle decimal case
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
      if (foundIn?.groups?.version && foundIn.groups.version.length > 0) {
        this.enabledVersion = foundIn.groups.version;
        this.debug("Enabled %s", this.enabledVersion);
      }
    } catch (error) {
      console.warn(`Failed to enable ${this.tool}`, error);
      if ("stdout" in (error as any)) {
        // trunk-ignore(eslint/@typescript-eslint/no-unsafe-member-access)
        console.log("Error output:", ((error as any).stdout as Buffer).toString());
      } else {
        console.log("Error keys:  ", Object.keys(error as object));
      }
    }
  }

  async installTool() {
    // Enable tested tool if specified
    if (!this.tool || !this.sandboxPath) {
      console.error("Tool or sandbox path not specified - we should not be here!");
      return;
    }
    try {
      // Sync the tool to ensure it's available
      await this.runTrunk(["tools", "install", this.tool, "--ci"]);
      const tools_subdir = fs.existsSync(path.resolve(this.sandboxPath ?? "", ".trunk/dev-tools"))
        ? "dev-tools"
        : "tools";
      for (const shim of this.getShims()) {
        if (
          !fs.existsSync(
            path.resolve(
              this.sandboxPath,
              ".trunk",
              tools_subdir,
              `${shim}${process.platform == "win32" ? ".bat" : ""}`,
            ),
          )
        ) {
          throw new Error(`Could not install or find installed ${shim}`);
        }
      }
      this.debug("Installed %s", this.tool);
    } catch (error) {
      console.warn(`Failed to enable ${this.tool}`, error);
      if ("stdout" in (error as any)) {
        // trunk-ignore(eslint/@typescript-eslint/no-unsafe-member-access)
        console.log("Error output:", ((error as any).stdout as Buffer).toString());
      } else {
        console.log("Error keys:  ", Object.keys(error as object));
      }
    }
  }

  runInstall = async (
    toolName: string,
  ): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
    details?: string;
  }> => {
    try {
      const { stdout, stderr } = await this.runTrunk(["tools", "install", toolName, "--ci"]);
      return { exitCode: 0, stdout, stderr, details: undefined };
    } catch (e: any) {
      let details = undefined;
      /* eslint-disable-next-line
        @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-member-access,
        @typescript-eslint/no-unsafe-assignment
      */
      const detailsPath = e.stdout.match(/\.trunk\/out\/(.+\.yaml)/);
      if (detailsPath) {
        details = await fs.promises.readFile(
          /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access */
          path.resolve(this.sandboxPath ?? "", detailsPath[0]),
          "utf8",
        );
      }

      /* eslint-disable @typescript-eslint/no-unsafe-member-access */
      return {
        exitCode: e.code as number,
        stdout: e.stdout as string,
        stderr: e.stderr as string,
        /* eslint-enable @typescript-eslint/no-unsafe-member-access */
        details,
      };
    }
  };

  /**
   * Parse the result of 'getFullTrunkConfig' in the context of 'ARGS' to identify the desired tool version to enable.
   */
  extractToolVersion = (): string => {
    const toEnableVersion = this.toEnableVersion ?? ARGS.linterVersion;

    // TODO(Tyler): We should leverage latest here and use the ReleaseVersionService
    if (!toEnableVersion || toEnableVersion === "Latest") {
      return "";
    } else if (toEnableVersion === "KnownGoodVersion") {
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

  async runTool(command: string[], stdin?: string): Promise<TrunkToolRunResult> {
    const tools_subdir = fs.existsSync(path.resolve(this.sandboxPath ?? "", ".trunk/dev-tools"))
      ? "dev-tools"
      : "tools";
    try {
      if (process.platform == "win32") {
        const { stdout, stderr } = await this.run(
          "powershell",
          [`.trunk/${tools_subdir}/${command[0]}.bat`, ...command.slice(1)],
          { stdin },
        );
        return {
          exitCode: 0,
          stdout,
          stderr,
        };
      }

      const { stdout, stderr } = await this.run(
        `.trunk/${tools_subdir}/${command[0]}`,
        command.slice(1),
        { stdin },
      );
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

  getShims(): string[] {
    // get the full trunk config
    // trunk-ignore-begin(eslint/@typescript-eslint/no-unsafe-assignment)
    // trunk-ignore-begin(eslint/@typescript-eslint/no-unsafe-member-access,eslint/@typescript-eslint/no-unsafe-call)
    const fullTrunkConfig = this.getFullTrunkConfig();
    // get the tool definition
    const toolDefinition = fullTrunkConfig.tools.definitions.find(
      ({ name }: { name: string }) => name === this.tool,
    );
    // get the shims
    const shims = toolDefinition?.shims ?? [];
    return shims.map(({ name }: { name: string }) => name) as string[];
    // trunk-ignore-end(eslint/@typescript-eslint/no-unsafe-assignment)
    // trunk-ignore-end(eslint/@typescript-eslint/no-unsafe-member-access,eslint/@typescript-eslint/no-unsafe-call)
  }
}
