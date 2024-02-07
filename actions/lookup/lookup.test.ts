// trunk-ignore-all(eslint/import/no-extraneous-dependencies)
// trunk-ignore-all(eslint/node/no-extraneous-import)
import semver from "semver";
import { actionRunTest } from "tests";
import { TrunkActionDriver } from "tests/driver";

const testCallback = async (driver: TrunkActionDriver) => {
  const result = await driver.runAction(".cli.version");
  expect(result.stderr).toBe("");
  driver.debug(result.stdout);
  console.log(result.stdout); // tODO: REMOVE
  const strippedStdout = result.stdout.replaceAll('"', "");
  expect(semver.parse(strippedStdout)).toBeTruthy();
  expect(result.exitCode).toBe(0);
};

actionRunTest({
  actionName: "lookup",
  syncGitHooks: false,
  testCallback,
});
