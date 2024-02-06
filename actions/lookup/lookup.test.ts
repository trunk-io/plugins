import { actionRunTest } from "tests";
import { TrunkActionDriver } from "tests/driver";
import semver from "semver";

const testCallback = async (driver: TrunkActionDriver) => {
  const result = await driver.runAction(".cli.version");
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  const strippedStdout = result.stdout.replaceAll('"', "");
  expect(semver.parse(strippedStdout)).toBeTruthy();
};

actionRunTest({
  actionName: "lookup",
  syncGitHooks: false,
  testCallback,
});
