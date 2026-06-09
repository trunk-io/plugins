import { customLinterCheckTest } from "tests";
import { type TrunkLintDriver } from "tests/driver";
import { skipOS, TEST_DATA } from "tests/utils";

// NOTE(Tyler): As of semgrep 1.117.0 the first (and only the first) semgrep run may end up excluding the --include paths
const preCheck = (driver: TrunkLintDriver) => {
  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);
  const lintRegex = /\nlint:/;
  const newContents = currentContents.replace(
    lintRegex,
    `
lint:
  definitions:
    - name: semgrep
      commands:
        - name: check
          run: semgrep --config=auto --sarif --output=\${tmpfile} --include=* --include=\${target}

`,
  );
  driver.writeFile(trunkYamlPath, newContents);
};

// Note semgrep runs can take a while since they require downloading rulesets each time.
customLinterCheckTest({
  linterName: "semgrep",
  preCheck,
  args: `${TEST_DATA} --cache=false`,
  skipTestIf: skipOS(["win32"]),
});
