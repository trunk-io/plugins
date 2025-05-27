import * as fs from "fs";
import path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { REPO_ROOT, skipCPUOS, TEST_DATA } from "tests/utils";

// You must login in order to use sourcery
const preCheck = (driver: TrunkLintDriver) => {
  driver.moveFile(path.join(TEST_DATA, "_plugin.yaml"), path.join(TEST_DATA, "plugin.yaml"));

  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);
  const lintRegex = /\nlint:/;
  const newContents = currentContents.replace(
    lintRegex,
    `
  - id: plugin-overrides
    local: .
lint:`,
  );
  driver.writeFile(trunkYamlPath, newContents);

  // NOTE(Tyler): Sourcery relies on checking if the repo is open source for its pricing model.
  // The sandbox tests run on a subset of the main repo, and it needs access to the repo root .git folder in order to run.
  driver.deleteFile(".git");
  fs.symlinkSync(path.join(REPO_ROOT, ".git"), path.join(driver.getSandbox(), ".git"));
};

customLinterCheckTest({
  linterName: "sourcery",
  // Deliberately use -a here because our test setup involves messing with .git, which obscures the state of upstream.
  args: "-a --cache=false",
  preCheck,
  skipTestIf: (version) => {
    if (!process.env.SOURCERY_TOKEN) {
      // NOTE(Tyler): This is the simplest approach in order to streamline local development and running from forks.
      console.log(
        "Skipping sourcery test. Must provide SOURCERY_TOKEN environment variable in order to run.",
      );
      return true;
    }
    return skipCPUOS([
      { os: "linux", cpu: "arm64" },
      { os: "win32", cpu: "x64" },
    ])(version);
  },
});
