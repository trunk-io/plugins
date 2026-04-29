import { actionRunTest } from "tests";
import { TrunkActionDriver } from "tests/driver";

const preCheck = (driver: TrunkActionDriver) => {
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

  driver.writeFile(
    "modules/a/main.tf",
    `variable "name" {
  description = "Example input."
  type        = string
}
`,
  );
};

const testCallback = async (driver: TrunkActionDriver) => {
  // Stage the new .tf file so the pre-commit hook's `git diff --cached`
  // picks it up and runs terraform-docs against modules/a.
  await driver.gitDriver?.add("modules/a/main.tf");

  let commitError: Error | undefined;
  try {
    await driver.gitDriver?.commit("Add module a", [], { "--allow-empty": null });
  } catch (err) {
    commitError = err as Error;
  }

  // terraform-docs regenerates modules/a/README.md, which is untracked at
  // commit time. The hook should reject the commit until the developer
  // stages the new doc.
  expect(commitError).toBeDefined();
  expect(commitError?.message).toContain("Please stage any README changes before committing.");
};

// NOTE: Skipped by default. Running this test requires `terraform-docs` on
// PATH inside the action sandbox; the action's plugin.yaml does not declare a
// tool dependency, so CI would need a setup step (similar to the uv setup in
// .github/actions/action_tests/action.yaml) to install terraform-docs before
// the jest run. Drop `skipTestIf` once that is in place.
actionRunTest({
  actionName: "terraform-docs",
  syncGitHooks: true,
  preCheck,
  testCallback,
  skipTestIf: () => true,
});
