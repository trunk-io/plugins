import * as fs from "fs";
import * as path from "path";
import { actionRunTest, toolInstallTest } from "tests";
import { TrunkActionDriver } from "tests/driver";

toolInstallTest({
  toolName: "poetry",
  toolVersion: "1.8.2",
});

const preCheck = (authors: boolean) => (driver: TrunkActionDriver) => {
  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);
  const newContents = currentContents.concat(`
  definitions:
    - id: poetry-check
      runtime: python
      packages_file: \${cwd}/requirements.txt
    - id: poetry-lock
      runtime: python
      packages_file: \${cwd}/requirements.txt
    - id: poetry-export
      runtime: python
      packages_file: \${cwd}/requirements.txt`);
  driver.writeFile(trunkYamlPath, newContents);

  const authorsSection = authors ? "authors = []" : "";
  driver.writeFile(
    "pyproject.toml",
    `[tool.poetry]
name = "poetry-test"
version = "0.1.0"
description = ""
${authorsSection}

[tool.poetry.dependencies]
python = "^3.10"
pendulum = "^3.0.0"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
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
        expect(error?.message).toContain("The fields ['authors'] are required in package mode.");
        expect(result).toBeUndefined();
      },
    );

    // Commit step should throw
    expect(1).toBe(2);
  } catch (_err) {
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
  } catch (_err) {
    // Intentionally empty
  }
};

actionRunTest({
  actionName: "poetry-check",
  syncGitHooks: true,
  testCallback: checkTestCallback,
  preCheck: preCheck(/*authors=*/ false),
});

actionRunTest({
  actionName: "poetry-lock",
  syncGitHooks: true,
  testCallback: fileExistsCallback("poetry.lock"),
  preCheck: preCheck(/*authors=*/ true),
});

actionRunTest({
  actionName: "poetry-export",
  syncGitHooks: true,
  testCallback: fileExistsCallback("requirements.txt"),
  preCheck: preCheck(/*authors=*/ true),
});
