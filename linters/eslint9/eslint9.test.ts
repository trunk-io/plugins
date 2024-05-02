import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { osTimeoutMultiplier, TEST_DATA } from "tests/utils";

const INSTALL_TIMEOUT = 150000 * osTimeoutMultiplier;

const moveConfig = (driver: TrunkLintDriver) => {
  ["eslint.config.cjs", "package.json", "package-lock.json"].forEach((file) => {
    driver.moveFile(path.join(TEST_DATA, file), file);
  });
};

const preCheck = (driver: TrunkLintDriver) => {
  moveConfig(driver);
  // TODO(Tyler): Cache node_modules between runs
  try {
    const trunkYamlPath = ".trunk/trunk.yaml";
    const currentContents = driver.readFile(trunkYamlPath);
    const newContents = currentContents.concat(`tools:
    runtimes:
      - node
  `);
    driver.writeFile(trunkYamlPath, newContents);

    // NOTE(Tyler): It is slower to use the hermetic Trunk installation of the npm shim, but it is safer for more platforms
    // and avoids unhelpful circular JSON error messages.
    driver.debug("About to install shims");
    driver.runTrunkSync(["tools", "install"]);
    driver.debug("Done installing shims");
    const toolsPath = fs.existsSync(path.resolve(driver.getSandbox(), ".trunk/dev-tools"))
      ? "dev-tools"
      : "tools";
    driver.debug(
      `shim contents: ${fs
        .readdirSync(path.resolve(driver.getSandbox(), `.trunk/${toolsPath}`))
        .join(", ")}`,
    );

    driver.debug(`About to install eslint9 deps to ${driver.getSandbox()}`);
    const install = spawnSync(
      path.resolve(
        driver.getSandbox(),
        `.trunk/${toolsPath}`,
        process.platform == "win32" ? "npm.bat" : "npm",
      ),
      ["ci"],
      {
        cwd: driver.getSandbox(),
        timeout: INSTALL_TIMEOUT,
        windowsHide: true,
        shell: true,
      },
    );
    driver.debug(install);
    if (install.status !== 0) {
      driver.debug(install.stdout.toString());
      driver.debug(install.stderr.toString());
    }
  } catch (err: any) {
    console.warn("Error installing eslint9 deps");
    console.warn(err);
    throw err;
  }
};

// This set of testing is incomplete with regard to failure modes and unicode autofixes with eslint9, but it serves as a sampling
// Use upstream=false in order to supply autofixes for committed files.
customLinterCheckTest({
  linterName: "eslint9",
  args: `${TEST_DATA} -y --upstream=false`,
  preCheck,
  pathsToSnapshot: [
    path.join(TEST_DATA, "non_ascii.ts"),
    path.join(TEST_DATA, "eof_autofix.ts"),
    path.join(TEST_DATA, "format_imports.ts"),
  ],
});

customLinterCheckTest({
  linterName: "eslint9",
  testName: "bad_install",
  args: `${TEST_DATA} -y`,
  preCheck: moveConfig,
});
