import { execSync } from "child_process";
import path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

const INSTALL_TIMEOUT = 60000;

const moveConfig = (driver: TrunkLintDriver) => {
  [".eslintrc.yaml", "package.json"].forEach((file) => {
    // trunk-ignore(semgrep): paths used here are safe
    driver.moveFile(path.join(TEST_DATA, file), file);
  });
};

const preCheck = (driver: TrunkLintDriver) => {
  moveConfig(driver);
  // TODO(Tyler): Cache node_modules between runs
  execSync("npm install", { cwd: driver.getSandbox(), timeout: INSTALL_TIMEOUT });
};

// This set of testing is incomplete with regard to failure modes and unicode autofixes with eslint, but it serves as a sampling
// Use upstream=false in order to supply autofixes for committed files.
customLinterCheckTest({
  linterName: "eslint",
  args: `${TEST_DATA} -y --upstream=false`,
  preCheck,
  pathsToSnapshot: [
    path.join(TEST_DATA, "non_ascii.ts"),
    path.join(TEST_DATA, "eof_autofix.ts"),
    path.join(TEST_DATA, "format_imports.ts"),
  ],
});

customLinterCheckTest({
  linterName: "eslint",
  testName: "bad_install",
  args: `${TEST_DATA} -y`,
  preCheck: moveConfig,
});
