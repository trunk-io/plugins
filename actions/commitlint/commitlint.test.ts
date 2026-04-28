import { actionRunTest } from "tests";
import { TrunkActionDriver } from "tests/driver";

const preCheck = (driver: TrunkActionDriver) => {
  driver.writeFile(
    "commitlint.config.mjs",
    "export default {extends: ['@commitlint/config-conventional']}",
  );
};

const testCallback = async (driver: TrunkActionDriver) => {
  let commitError: Error | undefined;
  try {
    await driver.gitDriver?.commit("Test commit", [], { "--allow-empty": null });
  } catch (err) {
    commitError = err as Error;
  }

  // Commit step should throw because commitlint rejects the invalid message.
  expect(commitError).toBeDefined();
  expect(commitError?.message).toContain("subject may not be empty [subject-empty]");
  expect(commitError?.message).toContain("type may not be empty [type-empty]");
};

actionRunTest({
  actionName: "commitlint",
  syncGitHooks: true,
  testCallback,
  preCheck,
});
