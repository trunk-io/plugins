import { exec } from "child_process";
import path from "path";
import { parseInputs, setupDriver } from "tests";
import { REPO_ROOT } from "tests/driver";

// Run trunk check from the root of the repository to verify a healthy config
describe(`Global config health check`, () => {
  // Step 1: Parse any custom inputs
  const inputArgs = parseInputs();

  // Step 2: Define test setup and teardown
  const subfolder = path.join(REPO_ROOT, "linters");
  const driver = setupDriver(subfolder, inputArgs, {
    setupGit: false,
    setupTrunk: false,
  });

  // Step 3: Run check
  it("trunk check from repo root", async () => {
    const daemonCommand = `${inputArgs.cliPath ?? "trunk"} daemon launch --monitor=false`;
    exec(daemonCommand, { cwd: driver.sandboxPath, timeout: 1000 });

    const trunkConfig = driver.GetTrunkConfig();
    let alreadyLocal = false;
    for (const source of trunkConfig["plugins"]["sources"]) {
      if (source["id"] == "trunk" && source["local"]) {
        alreadyLocal = true;
      }
    }

    if (!alreadyLocal) {
      await driver.Run("run toggle-local").catch((error: Error) => {
        console.log(error);
      });
    }

    const test_run_result = await driver.RunCheck();
    expect(test_run_result.success);
    expect(test_run_result.landingState).toBeDefined();
    expect(test_run_result.landingState?.taskFailures).toHaveLength(0);
  });
});
