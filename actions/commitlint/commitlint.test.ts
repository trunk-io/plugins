/* trunk-ignore-all(eslint/import/no-extraneous-dependencies) */
import { actionRunTest } from "tests";
import { TrunkActionDriver } from "tests/driver";

const preCheck = (driver: TrunkActionDriver) => {
  driver.writeFile(
    "commitlint.config.mjs",
    "export default {extends: ['@commitlint/config-conventional']}",
  );
};

const testCallback = async (driver: TrunkActionDriver) => {
  try {
    await driver.gitDriver?.commit(
      "Test commit",
      [],
      { "--allow-empty": null },
      (error, result) => {
        expect(error?.message).toContain("subject may not be empty [subject-empty]");
        expect(error?.message).toContain("type may not be empty [type-empty]");
        expect(result).toBeUndefined();
      },
    );

    // Commit step should throw
    expect(1).toBe(2);
  } catch (_err) {
    // Intentionally empty
  }
};

actionRunTest({
  actionName: "commitlint",
  syncGitHooks: true,
  testCallback,
  preCheck,
});
