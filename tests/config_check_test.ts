import path from "path";
import { setupDriver } from "tests";
import { REPO_ROOT } from "tests/utils";

// Run 'trunk config print' from the root of the repository to verify a healthy config

// Step 1: Define test setup and teardown
const subfolder = path.resolve(REPO_ROOT, "linters");

describe("Global config health check", () => {
  console.log("Defining driver");
  const driver = setupDriver(subfolder, {
    setupGit: false,
    setupTrunk: false,
    launchDaemon: true,
  });

  // Step 2: Validate config
  it("trunk config print from repo root", async () => {
    console.log("Getting config from repo");
    // trunk-ignore(eslint/@typescript-eslint/no-unsafe-assignment)
    const trunkConfig = driver.getTrunkConfig();
    console.log(`Got config. Is it undefined? ${trunkConfig}`);
    // trunk-ignore(eslint)
    const alreadyLocal: boolean = trunkConfig.plugins.sources.some(
      ({ id, local }: { id: string; local: boolean }) => id === "trunk" && local
    );
    console.log(`Already local: ${alreadyLocal}`);

    // Ensure config includes the local copy of this repo as a plugin source
    if (!alreadyLocal) {
      const toggleLocal = await driver.run("run toggle-local");
      console.log(`stdout: ${toggleLocal.stdout}\nstderr: ${toggleLocal.stderr}`);
    }

    console.log("Config print");

    // Test that config healthily resolves
    const testRunResult = await driver.run("config print");
    console.log(`stdout: ${testRunResult.stdout.length}\nstderr: ${testRunResult.stderr}`);
    expect(testRunResult.stdout).toContain("version: 0.1");
    expect(testRunResult.stdout).toContain("local:");
  });
});
