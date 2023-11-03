import path from "path";
import { linterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { skipCPUOS, TEST_DATA } from "tests/utils";

// // You must login in order to use sourcery
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
};

linterCheckTest({
  linterName: "sourcery",
  preCheck,
  // TODO(Tyler): Sourcery's new pricing model means that we can no longer run trunk+sourcery
  // in sandboxes with their open source tier. Disable this test until we have a robust solution.
  skipTestIf: () => true,
  // skipTestIf: (version) => {
  //   return true;
  //   if (!process.env.SOURCERY_TOKEN) {
  //     // NOTE(Tyler): This is the simplest approach in order to streamline local development and running from forks.
  //     console.log(
  //       "Skipping sourcery test. Must provide SOURCERY_TOKEN environment variable in order to run.",
  //     );
  //     return true;
  //   }
  //   return skipCPUOS([{ os: "linux", cpu: "arm64" }])(version);
  // },
});
