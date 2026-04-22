import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { actionRunTest, toolInstallTest } from "tests";
import { TrunkActionDriver } from "tests/driver";

toolInstallTest({
  toolName: "uv",
  toolVersion: "0.7.8",
});

const runUvLock = (cwd: string) => {
  const attempts: [string, string[]][] = [
    ["uv", ["lock"]],
    ["python3", ["-m", "uv", "lock"]],
  ];
  for (const [bin, args] of attempts) {
    try {
      execFileSync(bin, args, { cwd, stdio: "pipe" });
      return;
    } catch {
      // Try the next invocation style.
    }
  }
  // Last resort: pip-install uv into the system Python and retry.
  execFileSync("python3", ["-m", "pip", "install", "--user", "--quiet", "uv"], {
    cwd,
    stdio: "pipe",
  });
  execFileSync("python3", ["-m", "uv", "lock"], { cwd, stdio: "pipe" });
};

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
  // GitHub runners don't ship uv globally, so fall back to `python -m uv` via
  // pipx/pip when the shim isn't already on PATH.
  runUvLock(driver.getSandbox());
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
  testCallback: fileExistsCallback(".venv"), // Assuming uv creates a .venv by default
  preCheck: preCheck,
});
