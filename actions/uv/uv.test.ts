import * as fs from "fs";
import * as path from "path";
import { actionRunTest, toolInstallTest } from "tests";
import { TrunkActionDriver } from "tests/driver";

toolInstallTest({
  toolName: "uv",
  toolVersion: "0.3",
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

[project.dependencies]
python = "^3.12"
pendulum = "^3.0.0"
  `,
  );
};

const checkTestCallback = async (driver: TrunkActionDriver) => {
  try {
    await driver.gitDriver?.commit(
      "Test commit",
      [],
      { "--allow-empty": null },
      (error, result) => {
        // uv check should pass for a valid pyproject.toml
        expect(error).toBeFalsy();
        expect(result).toBeTruthy();
      },
    );
  } catch {
    // Intentionally empty
  }
};

const fileExistsCallback = (filename: string) => async (driver: TrunkActionDriver) => {
  try {
    await driver.gitDriver?.commit(
      "Test commit",
      [],
      { "--allow-empty": null },
      (_error, result) => {
        expect(_error).toBeFalsy();
        expect(result).toBeTruthy();
      },
    );

    expect(fs.existsSync(path.resolve(driver.getSandbox(), filename))).toBeTruthy();
  } catch {
    // Intentionally empty
  }
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
