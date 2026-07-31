import * as fs from "fs";
import * as path from "path";
import { customLinterCheckTest, setupLintDriver } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { conditionalTest, TEST_DATA } from "tests/utils";

const moveWorkflowFile =
  (filename: string, disableGhAuth = false) =>
  async (driver: TrunkLintDriver) => {
    if (disableGhAuth) {
      process.env.PINACT_DISABLE_GH_AUTH = "1";
    } else {
      delete process.env.PINACT_DISABLE_GH_AUTH;
    }
    driver.moveFile(path.join(TEST_DATA, filename), path.join(".github/workflows", filename));
    await driver.gitDriver?.add(".").commit("moved");
  };

const moveWorkflowFiles =
  (sourceDir = TEST_DATA) =>
  async (driver: TrunkLintDriver) => {
    delete process.env.PINACT_DISABLE_GH_AUTH;

    fs.readdirSync(path.resolve(driver.getSandbox(), sourceDir), { withFileTypes: true })
      .filter((file) => file.isFile())
      .forEach((file) => {
        driver.moveFile(path.join(sourceDir, file.name), path.join(".github/workflows", file.name));
      });
    await driver.gitDriver?.add(".").commit("moved");
  };

const enablePinactCommand =
  (command: string, preCheck?: (driver: TrunkLintDriver) => Promise<void>) =>
  async (driver: TrunkLintDriver) => {
    delete process.env.PINACT_DISABLE_GH_AUTH;

    const trunkYamlPath = ".trunk/trunk.yaml";
    const currentContents = driver.readFile(trunkYamlPath);
    const pinactRegex = /- pinact@(.+)\n/;

    driver.writeFile(
      trunkYamlPath,
      currentContents.replace(pinactRegex, `- pinact@$1:\n        commands: [${command}]\n`),
    );

    if (preCheck) {
      await preCheck(driver);
    }
  };

const skipIfMissingGitHubToken = () => {
  if (!process.env.GH_TOKEN && !process.env.GITHUB_TOKEN && !process.env.PINACT_GITHUB_TOKEN) {
    console.log(
      "Skipping pinact online audit test because GH_TOKEN, GITHUB_TOKEN, and PINACT_GITHUB_TOKEN are not set.",
    );
    return true;
  }
  return false;
};

const preCheckBadConfig = async (driver: TrunkLintDriver) => {
  process.env.PINACT_DISABLE_GH_AUTH = "1";
  driver.moveFile(path.join(TEST_DATA, "bad.pinact.yaml"), path.join(".pinact.yaml"));
  driver.moveFile(
    path.join(TEST_DATA, "missing_version_comment.in.yaml"),
    path.join(".github/workflows", "missing_version_comment.in.yaml"),
  );
  await driver.gitDriver?.add(".").commit("moved");
};

customLinterCheckTest({
  linterName: "pinact",
  testName: "bad_config",
  args: ".github",
  preCheck: preCheckBadConfig,
});

customLinterCheckTest({
  linterName: "pinact",
  testName: "missing_version_comment",
  args: ".github",
  preCheck: moveWorkflowFile("missing_version_comment.in.yaml", true),
});

customLinterCheckTest({
  linterName: "pinact",
  testName: "unpinned",
  args: ".github",
  preCheck: moveWorkflowFile("unpinned.in.yaml", true),
});

customLinterCheckTest({
  linterName: "pinact",
  testName: "version_comment",
  args: ".github",
  preCheck: moveWorkflowFiles(path.join(TEST_DATA, "online")),
  skipTestIf: skipIfMissingGitHubToken,
});

customLinterCheckTest({
  linterName: "pinact",
  testName: "upgrade",
  args: ".github",
  preCheck: enablePinactCommand("upgrade", moveWorkflowFile("unpinned.in.yaml")),
  skipTestIf: skipIfMissingGitHubToken,
});

// The snapshot tests above never apply a fix (the driver's runCheck forces
// `-n`), so none of them caught pinact SARIF whose `deletedRegion` was
// line-only: Trunk read that as a zero-width insert and concatenated the pinned
// `uses:` with the original one on a single line. This applies the fix for real
// and asserts the rewrite is clean. Kept online (a resolvable SHA is required to
// exercise the fix path) and version-independent (no snapshot of the volatile
// SHA) — it only asserts the structural invariant the bug violated.
describe("Testing linter pinact fix application", () => {
  const driver = setupLintDriver(
    __dirname,
    {},
    "pinact",
    undefined,
    moveWorkflowFile("unpinned.in.yaml"),
  );

  conditionalTest(
    skipIfMissingGitHubToken(),
    "pins to a SHA without corrupting the line",
    async () => {
      await driver
        .runTrunkCmd("check --filter=pinact --fix -y --no-progress --ignore-git-state .github")
        .catch(() => undefined);

      const fixed = driver.readFile(".github/workflows/unpinned.in.yaml");
      // The action is pinned to a full 40-char SHA with its version comment...
      expect(fixed).toMatch(/uses: actions\/checkout@[0-9a-f]{40} # v\d/);
      // ...and no line carries the concatenated `<pinned> # … <original>` corruption.
      expect(fixed).not.toMatch(/uses:.*#.*uses:/);
    },
  );
});
