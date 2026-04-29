import { actionRunTest } from "tests";
import { TrunkActionDriver } from "tests/driver";

const enableTerraformDocsTool = (driver: TrunkActionDriver) => {
  // The action shells out to `terraform-docs`, so the tool's shim has to be on
  // PATH inside the sandbox. The base trunk.yaml only enables the action; we
  // append a `tools` block here.
  const trunkYamlPath = ".trunk/trunk.yaml";
  driver.writeFile(
    trunkYamlPath,
    driver.readFile(trunkYamlPath).concat(`
tools:
  enabled:
    - terraform-docs@0.16.0
`),
  );
};

const writeStagedTerraformModule = async (driver: TrunkActionDriver) => {
  driver.writeFile(
    "modules/a/main.tf",
    `variable "name" {
  description = "Example input."
  type        = string
}
`,
  );
  // Stage it so `git diff --cached --name-only` picks it up inside the hook.
  await driver.gitDriver?.add("modules/a/main.tf");
};

// Failure path: a staged .tf change causes terraform-docs to (re)generate a
// README. The hook detects the unstaged/untracked README and rejects the
// commit until the developer stages it.
actionRunTest({
  actionName: "terraform-docs",
  syncGitHooks: true,
  preCheck: async (driver) => {
    enableTerraformDocsTool(driver);
    await writeStagedTerraformModule(driver);
  },
  testCallback: async (driver) => {
    let commitError: Error | undefined;
    try {
      await driver.gitDriver?.commit("Add module a", [], {
        "--allow-empty": null,
      });
    } catch (err) {
      commitError = err as Error;
    }

    expect(commitError).toBeDefined();
    expect(commitError?.message).toContain("Please stage any README changes before committing.");
  },
});

// No-op path: when no Terraform files have changed, the action exits early and
// the commit succeeds without invoking terraform-docs.
actionRunTest({
  actionName: "terraform-docs",
  syncGitHooks: true,
  preCheck: enableTerraformDocsTool,
  testCallback: async (driver) => {
    const result = await driver.gitDriver?.commit("Empty commit", [], {
      "--allow-empty": null,
    });
    expect(result).toBeTruthy();
    expect(driver.readGitStdout()).toContain(
      "No Terraform files changed, skipping documentation update",
    );
  },
});
