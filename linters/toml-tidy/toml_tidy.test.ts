import { linterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";

// toml-tidy requires python >=3.12, newer than the default hermetic runtime
const preCheck = (driver: TrunkLintDriver) => {
  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);
  const newContents = currentContents.concat(`runtimes:
  enabled:
    - python@3.12.2
`);
  driver.writeFile(trunkYamlPath, newContents);
};

linterFmtTest({ linterName: "toml-tidy", preCheck });
