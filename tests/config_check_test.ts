import { exec } from "child_process";
import path from "path";
import { setupDriver } from "tests";
import { ARGS, REPO_ROOT } from "tests/utils";
import { getTrunkConfig } from "tests/utils/trunk_config";

// Run 'trunk config print' from the root of the repository to verify a healthy config

// Step 1: Define test setup and teardown
const subfolder = path.resolve(REPO_ROOT, "linters");

describe("Global config health check", () => {
  const driver = setupDriver(subfolder, {
    setupGit: false,
    setupTrunk: false,
  });

  // Step 2: Validate config
  it("trunk config print from repo root", async () => {
    const trunkConfig = getTrunkConfig(driver.sandboxPath ?? "");
    const alreadyLocal = trunkConfig.plugins.sources.some(
      ({ id, local }: { id: string; local: boolean }) => id === "trunk" && local
    );

    if (!alreadyLocal) {
      const runner = exec(
        `${ARGS.cliPath ?? "trunk"} run toggle-local`,
        { cwd: driver.sandboxPath, timeout: 5000 },
        (_error, _stdout, _stderr) => {}
      );
      runner.on("close", () => {
        runner.kill();
      });
      // await runner;
    }

    // Test that config healthily resolves
    const testRunResult = await driver.run("config print");
    expect(testRunResult.stdout).toContain("version: 0.1");
  });
});
