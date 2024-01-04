import Debug from "debug";
import * as fs from "fs";
import path from "path";
import { GenericTrunkDriver, SetupSettings } from "tests/driver/driver";
import { REPO_ROOT } from "tests/utils";
import { getTrunkVersion } from "tests/utils/trunk_config";

const baseDebug = Debug("Driver");

let testNum = 1;
const actionTests = new Map<string, number>();

const getDebugger = (tool?: string) => {
  if (!tool) {
    // If a tool is not provided, provide a counter for easy distinction
    return baseDebug.extend(`test${testNum++}`);
  }
  const numActionTests = actionTests.get(tool);
  const newNum = (numActionTests ?? 0) + 1;
  actionTests.set(tool, newNum);
  return baseDebug.extend(tool).extend(`${newNum}`);
};

export class TrunkActionDriver extends GenericTrunkDriver {
  constructor(
    testDir: string,
    setupSettings: SetupSettings,
    private action: string,
    private syncGitHooks: boolean,
  ) {
    super(testDir, setupSettings, getDebugger(action));
    this.action = action;
    this.syncGitHooks = syncGitHooks;
  }

  getTrunkYamlContents(trunkVersion: string | undefined): string {
    return `version: 0.1
cli:
  version: ${trunkVersion ?? getTrunkVersion()}
plugins:
  sources:
  - id: trunk
    local: ${REPO_ROOT}
actions:
  enabled:
    - ${this.action}
`;
  }

  /**
   * Setup a sandbox test directory by copying in test contents and conditionally:
   * 1. Creating a git repo
   * 2. Dumping a newly generated trunk.yaml
   * 3. Calling git hooks sync
   */
  async setUp() {
    await super.setUp();

    if (!this.syncGitHooks || !this.sandboxPath) {
      return;
    }
    try {
      this.debug("Syncing git hooks");
      await this.runTrunk(["git-hooks", "sync"]);

      this.debug("Attaching stdout and stderr pipes");
      const stdoutPath = path.resolve(this.sandboxPath, "stdout");
      const stderrPath = path.resolve(this.sandboxPath, "stderr");
      const stdoutStream = fs.createWriteStream(stdoutPath);
      const stderrStream = fs.createWriteStream(stderrPath);
      this.gitDriver?.outputHandler((_command, stdout, stderr) => {
        // See https://github.com/steveukx/git-js/blob/main/examples/git-output-handler.md for more info
        stdout.pipe(stdoutStream);
        stderr.pipe(stderrStream);
      });
    } catch (error) {
      console.warn(`Failed to sync git hooks for ${this.action}`, error);
      if ("stdout" in (error as any)) {
        // trunk-ignore(eslint/@typescript-eslint/no-unsafe-member-access)
        console.log("Error output:", ((error as any).stdout as Buffer).toString());
      } else {
        console.log("Error keys:  ", Object.keys(error as object));
      }
    }
  }

  runAction = async (
    args?: string,
  ): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }> => {
    try {
      const { stdout, stderr } = await this.runTrunk(["run", this.action, args ?? ""]);
      return { exitCode: 0, stdout, stderr };
    } catch (e: any) {
      // trunk-ignore(eslint/@typescript-eslint/no-unsafe-member-access)
      return { exitCode: e.code as number, stdout: e.stdout as string, stderr: e.stderr as string };
    }
  };

  readGitStdout = (): string => {
    return this.readFile("stdout");
  };

  readGitStderr = (): string => {
    return this.readFile("stderr");
  };

  flushGitStdout = () => {
    this.deleteFile("stdout");
  };

  flushGitStderr = () => {
    this.deleteFile("stderr");
  };
}
