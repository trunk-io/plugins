import { ChildProcess, execFile, execFileSync, ExecOptions, execSync } from "child_process";
import { Debugger } from "debug";
import * as fs from "fs";
import * as os from "os";
import path from "path";
import * as git from "simple-git";
import { SetupSettings } from "tests/driver";
import { ARGS, REPO_ROOT, TEST_DATA } from "tests/utils";
import { getTrunkConfig, newTrunkYamlContents } from "tests/utils/trunk_config";
import * as util from "util";
import YAML from "yaml";

const execFilePromise = util.promisify(execFile);

const TEMP_PREFIX = "plugins_";

const TEMP_SUBDIR = "tmp";

const UNINITIALIZED_ERROR = `You have attempted to modify the sandbox before it was created.
Please call this method after setup has been called.`;

const executionEnv = (sandbox: string) => {
  // trunk-ignore(eslint/@typescript-eslint/no-unused-vars): TRUNK_CLI_VERSION must be stripped from CI-Debugger
  const { PWD, INIT_CWD, TRUNK_CLI_VERSION, ...strippedEnv } = process.env;
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

/**
 * Create test repo. Don't copy snapshot files or direct_configs
 */
const testCreationFilter = (topLevelDir: string) => (file: string) => {
  // Don't copy snapshot files
  if (file.endsWith(".shot")) {
    return false;
  }

  const { base, dir } = path.parse(file);
  // If top-level, only copy plugin.yaml, test file, test_data, and parsers
  if (base !== TEST_DATA && dir === topLevelDir) {
    return (
      base === "plugin.yaml" ||
      base.endsWith(".test.ts") ||
      base.endsWith(".py") ||
      base.endsWith(".sh")
    );
  }

  return true;
};

export class GenericTrunkDriver {
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

  constructor(testDir: string, setupSettings: SetupSettings, debug: Debugger) {
    this.testDir = testDir;
    this.setupSettings = setupSettings;
    this.debug = debug;
    this.debugNamespace = this.debug.namespace.replace("Driver:", "");
  }

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
    fs.cpSync(this.testDir, this.sandboxPath, {
      recursive: true,
      filter: testCreationFilter(this.testDir),
    });

    if (this.setupSettings.setupTrunk) {
      // Initialize trunk via config
      if (!fs.existsSync(path.resolve(path.resolve(this.sandboxPath, ".trunk")))) {
        fs.mkdirSync(path.resolve(this.sandboxPath, ".trunk"), {});
      }
      fs.writeFileSync(
        path.resolve(this.sandboxPath, ".trunk/trunk.yaml"),
        newTrunkYamlContents(this.setupSettings.trunkVersion)
      );
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
      await this.runTrunk(["--help"]);
    } catch (error) {
      // The trunk launcher is not designed to handle concurrent installs.
      // This command may fail if another test installs at the same time.
      // Don't block if this happens.
      console.warn(`Error running --help`, error);
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
      console.log(`Preserving test dir ${this.getSandbox()}`);
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
    console.log("Running trunk config print");
    console.log("Here is cli path: ", ARGS.cliPath);
    const version = execSync(`${ARGS.cliPath ?? "trunk"} --version`, {
      cwd: this.sandboxPath,
    });
    console.log("Here is version: ", version.toString());
    const printConfig = execSync(`${ARGS.cliPath ?? "trunk"} config print`, {
      cwd: this.sandboxPath,
    });
    return YAML.parse(printConfig.toString());
  };

  async runTrunkCmd(
    argStr: string,
    execOptions?: ExecOptions
  ): Promise<{ stdout: string; stderr: string }> {
    return await this.runTrunk(
      argStr.split(" ").filter((arg) => arg.length > 0),
      execOptions
    );
  }

  /**
   * Run a specified trunk command with `args` and additional options.
   * @param args arguments to run, excluding `trunk`
   * @param execOptions
   */
  async runTrunk(
    args: string[],
    execOptions?: ExecOptions
  ): Promise<{ stdout: string; stderr: string }> {
    const trunkPath = ARGS.cliPath ?? "trunk";
    return await execFilePromise(
      trunkPath,
      args.filter((arg) => arg.length > 0),
      {
        cwd: this.sandboxPath,
        env: executionEnv(this.sandboxPath ?? ""),
        ...execOptions,
      }
    );
  }

  async run(bin: string, args: string[], execOptions?: ExecOptions) {
    return await execFilePromise(bin, args, {
      cwd: this.sandboxPath,
      env: executionEnv(this.sandboxPath ?? ""),
      ...execOptions,
    });
  }
}
