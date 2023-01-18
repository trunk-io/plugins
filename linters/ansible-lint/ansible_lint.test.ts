import path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

// ansible-lint's trunk invokations are trigger-based, so we need to add this to the trunk.yaml.
const preCheck = (driver: TrunkDriver) => {
  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);
  const newContents = currentContents.concat(`  triggers:
  # Run these linters
    - linters:
        - ansible-lint
      # If any files matching these change
      paths:
        - "**"
      # On this target (A directory in this case)
      targets:
        - jboss-standalone
`);
  driver.writeFile(trunkYamlPath, newContents);

  driver.moveFile(path.join(TEST_DATA, "jboss-standalone"), "jboss-standalone");
};

customLinterCheckTest({ linterName: "ansible-lint", preCheck });
