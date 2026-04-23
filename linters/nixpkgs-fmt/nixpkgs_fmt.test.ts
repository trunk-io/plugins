import { linterFmtTest } from "tests";
import { osTimeoutMultiplier, skipOS } from "tests/utils";
import { TrunkLintDriver } from "tests/driver";

jest.setTimeout(600000 * osTimeoutMultiplier);

const preCheck = (driver: TrunkLintDriver) => {
  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);
  const newContents = currentContents.concat(`runtimes:
  enabled:
    - rust@1.85.1
`);
  driver.writeFile(trunkYamlPath, newContents);
};

linterFmtTest({ linterName: "nixpkgs-fmt", skipTestIf: skipOS(["win32"]), preCheck });
