import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { actionRunTest, toolInstallTest } from "tests";
import { TrunkActionDriver } from "tests/driver";

toolInstallTest({
  toolName: "uv",
  toolVersion: "0.7.8",
});

const preCheck = (driver: TrunkActionDriver) => {
  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);
  const newContents = currentContents.concat(`
  definitions:
    - id: uv-check
      runtime: python
    - id: uv-lock
      runtime: python
    - id: uv-sync
      runtime: python`);
  driver.writeFile(trunkYamlPath, newContents);

  driver.writeFile(
    "pyproject.toml",
    `[project]
name = "uv-test"
version = "0.1.0"
description = ""
requires-python = ">=3.12"
dependencies = [
  "pendulum>=3.0.0",
]
  `,
  );

  // uv lock --check requires an existing lockfile; create it before the commit.
  // CI installs uv via astral-sh/setup-uv in the Action Tests composite.
  execSync("uv lock", { cwd: driver.getSandbox(), stdio: "pipe" });
};

const checkTestCallback = async (driver: TrunkActionDriver) => {
  // uv-check should accept a valid pyproject.toml and not block the commit.
  const result = await driver.gitDriver?.commit("Test commit", [], { "--allow-empty": null });
  expect(result).toBeTruthy();
};

const fileExistsCallback = (filename: string) => async (driver: TrunkActionDriver) => {
  const result = await driver.gitDriver?.commit("Test commit", [], { "--allow-empty": null });
  expect(result).toBeTruthy();
  expect(fs.existsSync(path.resolve(driver.getSandbox(), filename))).toBeTruthy();
};

actionRunTest({
  actionName: "uv-check",
  syncGitHooks: true,
  testCallback: checkTestCallback,
  preCheck: preCheck,
});

actionRunTest({
  actionName: "uv-lock",
  syncGitHooks: true,
  testCallback: fileExistsCallback("uv.lock"),
  preCheck: preCheck,
});

actionRunTest({
  actionName: "uv-sync",
  syncGitHooks: true,
  // uv-sync triggers on post-checkout/post-merge, not on commit, so invoke
  // the action directly via `trunk run` instead of piggy-backing on a
  // gitDriver.commit() that would never fire the hook.
  testCallback: async (driver: TrunkActionDriver) => {
    const { exitCode } = await driver.runAction();
    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.resolve(driver.getSandbox(), ".venv"))).toBeTruthy();
  },
  preCheck: preCheck,
});
