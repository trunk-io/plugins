import { linterFmtTest, TestCallback } from "tests";
import { skipOS } from "tests/utils";

// Earlier nixpkgs-fmt transitive dependencies are no longer
// supported through older rust runtime installs.
const preCheck: TestCallback = (driver) => {
  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);
  const newContents = currentContents.concat(`runtimes:
  enabled:
    - rust@1.65.0
`);
  driver.writeFile(trunkYamlPath, newContents);
};

linterFmtTest({ linterName: "nixpkgs-fmt", preCheck, skipTestIf: skipOS(["win32"]) });
