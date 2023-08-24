import path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { skipOS, TEST_DATA } from "tests/utils";

// ansible-lint's trunk invokations are trigger-based, so we need to add this to the trunk.yaml.
const preCheck =
  (fqcn = true) =>
  (driver: TrunkLintDriver) => {
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

    // See linters/ansible-lint/readme.md for details on non-FQCN support
    if (!fqcn) {
      const configFile = "jboss-standalone/demo-aws-launch.yml";
      driver.writeFile(
        configFile,
        driver.readFile(configFile).replace("amazon.aws.ec2_instance", "ec2"),
      );
    }
  };

customLinterCheckTest({
  linterName: "ansible-lint",
  testName: "FQCN",
  preCheck: preCheck(),
  skipTestIf: skipOS(["win32"]),
});
customLinterCheckTest({
  linterName: "ansible-lint",
  testName: "non_FQCN",
  preCheck: preCheck(false),
  skipTestIf: skipOS(["win32"]),
});
