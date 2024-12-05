import { linterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";

// Grab the root .editorconfig
const preCheck = (driver: TrunkLintDriver) => {
  driver.copyFileFromRoot(".editorconfig");

  // Older versions of ktlint require an older jdk
  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);
  const newContents = currentContents.concat(`runtimes:
  definitions:
    - type: java
      download: jdk-13
`);
  driver.writeFile(trunkYamlPath, newContents);
};

linterFmtTest({ linterName: "ktlint", preCheck });
