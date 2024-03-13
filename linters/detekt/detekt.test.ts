import * as fs from "fs";
import path from "path";
import { customLinterCheckTest, linterCheckTest, TestCallback } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { DOWNLOAD_CACHE, osTimeoutMultiplier, recurseLevels, skipOS, TEST_DATA } from "tests/utils";

// detekt tests can sometimes take a while.
jest.setTimeout(500000 * osTimeoutMultiplier);

// Running check on the input manually requires the existence of a top level .detekt.yaml
const preCheck = (driver: TrunkLintDriver) => {
  driver.writeFile(".detekt.yaml", "");
};

// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes.
linterCheckTest({
  linterName: "detekt",
  namedTestPrefixes: ["basic_detekt"],
  preCheck,
});

// detekt-explicit has no default settings, leading to an empty result
linterCheckTest({
  linterName: "detekt-explicit",
  namedTestPrefixes: ["basic_explicit"],
  preCheck,
});

// detekt-gradle tests rely on a particular gradle-focused system setup, and they require a level of greater configuration here.
// TODO(Tyler): Because of this setup, this leads to reduced coverage for different versions. We should augment this logic
// without using a static jar.
const gradlePreCheck: TestCallback = (driver) => {
  // Based on plugin.yaml, trunk invokes ${workspace}/gradlew and expects gradlew, etc. to exist at the workspace root.
  // However, we expect .trunk/trunk.yaml to exist at the workspace root as well, so we move each file up to the workspace.
  // trunk-ignore-begin(semgrep): paths used here are safe
  fs.readdirSync(path.resolve(driver.getSandbox(), TEST_DATA, "detekt_gradle")).forEach((file) => {
    driver.moveFile(path.join(TEST_DATA, "detekt_gradle", file), file);
  });

  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);
  const newContents = currentContents.concat(`  definitions:
    - name: detekt-gradle
      runtime: java
`);
  driver.writeFile(trunkYamlPath, newContents);

  driver.runTrunkSync(["install"]);
  const javaPath = recurseLevels(path.resolve(DOWNLOAD_CACHE, "jdk-13"), 1);
  const finalContents = newContents.concat(`      environment:
        - name: JAVA_HOME
          value: ${javaPath}
          optional: false
        - name: PATH
          list: ["\${env.PATH}"]
`);
  driver.writeFile(trunkYamlPath, finalContents);
  // trunk-ignore-end(semgrep)
};

// TODO(Tyler): detekt-gradle has issues resolving stdin correctly on Windows.
// Make sure to run `git lfs pull` before running this test.
customLinterCheckTest({
  linterName: "detekt-gradle",
  args: "-a",
  preCheck: gradlePreCheck,
  skipTestIf: skipOS(["win32"]),
});
