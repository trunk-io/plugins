import path from "path";
import { setupDriver } from "tests";
import { REPO_ROOT } from "tests/utils";

// Run 'trunk config print' from the root of the repository to verify a healthy config

// Step 1: Define test setup and teardown
const subfolder = path.resolve(REPO_ROOT, "linters");

describe("Global config health check", () => {
  const driver = setupDriver(subfolder, {
    setupGit: false,
    setupTrunk: true,
    launchDaemon: false,
  });

  // Step 2: Validate config
  it("trunk config print from repo root", async () => {
    // Test that config healthily resolves
    const testRunResult = await driver.run("config print");
    expect(testRunResult.stdout).toContain("version: 0.1");
    expect(testRunResult.stdout).toContain("local:");
  });
});
