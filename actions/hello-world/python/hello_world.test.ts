import * as fs from "fs";
import path from "path";
import { actionRunTest } from "tests";
import { TrunkActionDriver } from "tests/driver";

const testCallback = async (driver: TrunkActionDriver) => {
  // trunk-ignore(semgrep): Safe path
  const stderrPath = path.resolve(driver.getSandbox(), "stderr");
  const stderrStream = fs.createWriteStream(stderrPath);

  await driver.gitDriver
    ?.outputHandler((_command, _stdout, stderr) => {
      // See https://github.com/steveukx/git-js/blob/main/examples/git-output-handler.md for more info
      stderr.pipe(stderrStream);
    })
    .commit("Test commit", [], { "--allow-empty": null }, (error, result) => {
      expect(error).toBeNull();
      expect(result).toBeTruthy();
    });

  expect(fs.readFileSync(stderrPath, "utf8")).toContain("[34mHello[31m World");
};

actionRunTest({ actionName: "hello-world-python", syncGitHooks: true, testCallback });
