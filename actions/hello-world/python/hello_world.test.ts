import { actionRunTest } from "tests";
import { TrunkActionDriver } from "tests/driver";

const testCallback = async (driver: TrunkActionDriver) => {
  await driver.gitDriver?.commit("Test commit", [], { "--allow-empty": null }, (error, result) => {
    expect(error).toBeNull();
    expect(result).toBeTruthy();
  });

  expect(driver.readGitStderr()).toContain("[34mHello[31m World");
};

// NOTE(Tyler): This test is currently skipped. To demonstrate its functionality, remove the skipTestIf
actionRunTest({
  actionName: "hello-world-python",
  syncGitHooks: true,
  testCallback,
  skipTestIf: () => true,
});
