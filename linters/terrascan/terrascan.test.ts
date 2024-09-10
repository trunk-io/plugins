import { linterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";

const preCheck = (driver: TrunkLintDriver) => {
  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);

  // NOTE(Tyler): The first time terrascan runs, if the policy cache is empty,
  // and multiple jobs are running concurrently, it can fail with a git error.
  // In the future we should have a retry feature for something like this,
  // but for now limiting concurrency during testing will do.
  const newContents = currentContents.concat(`  definitions:
    - name: terrascan
      commands:
        - name: lint
          max_concurrency: 1
        - name: lint-docker
          max_concurrency: 1
`);
  driver.writeFile(trunkYamlPath, newContents);
};

// TODO(Tyler): Fix flakiness with this test.
linterCheckTest({ linterName: "terrascan", preCheck, skipTestIf: () => true });
