import { linterCheckTest, linterFmtTest } from "tests";
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

linterFmtTest({ linterName: "ktlint", namedTestPrefixes: ["basic", "complex", "utf8"], preCheck });

// The lint command is disabled by default, so enable it alongside format.
const lintPreCheck = (driver: TrunkLintDriver) => {
  preCheck(driver);
  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);
  const newContents = currentContents.replace(
    /- ktlint@(.+)\n/,
    "- ktlint@$1:\n        commands: [format, lint]\n",
  );
  driver.writeFile(trunkYamlPath, newContents);
};

// non_fixable holds a rule ktlint -F cannot autocorrect, which the format command accepts.
// parse_error ends inside an unfinished declaration, where ktlint reports the error one line
// past the end of the file.
linterCheckTest({
  linterName: "ktlint",
  namedTestPrefixes: ["non_fixable", "parse_error"],
  preCheck: lintPreCheck,
});
