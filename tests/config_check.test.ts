import { setupDriver } from "tests";
import { REPO_ROOT } from "tests/utils";

// This test runs 'trunk config print' from the root of the repository to verify a healthy config.
// This serves as a general, basic healthcheck and asserts that all definitions resolve correctly,
// even in the context of each other. If this test were to fail, users would experience config errors
// when sourcing plugins from this repository.
describe("Global config health check", () => {
  // Step 1: Define test setup and teardown
  const driver = setupDriver(REPO_ROOT, {
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
