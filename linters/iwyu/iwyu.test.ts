import * as fs from "fs";
import path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

// iwyu doesn't use semver versioning, so we need to pass a custom callback.
// Examples of iwyu versions include 0.10, 0.19
const versionGreaterThanOrEqual = (a: string, b: string) => [a.split(".")] > [b.split(".")];

const preCheck = (driver: TrunkDriver) => {
  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);
  // Because include-what-you-use requires greater build-level awareness for full functionality, and we can't rely on certain
  // system-installed tools, this test provides some simple overrides to exercise the basic functionality.
  const newContents = currentContents.concat(`  definitions:
    - name: include-what-you-use
      commands:
        - name: lint
          run_linter_from: compile_command
          run: include-what-you-use -Xiwyu --no_fwd_decls \${compile_command}
          disable_upstream: true
          cache_results: false
      include_scanner_type: none
  compile_commands: json`);
  driver.writeFile(trunkYamlPath, newContents);

  // Move files to root
  // trunk-ignore-begin(semgrep): paths used here are safe
  fs.readdirSync(path.resolve(driver.getSandbox(), TEST_DATA)).forEach((file) => {
    driver.moveFile(path.join(TEST_DATA, file), file);
  });
  // trunk-ignore-end(semgrep)

  // Resolve templates in compile_commands.json
  const oldCompileContents = driver.readFile("compile_commands.json");
  const newCompileContents = oldCompileContents.replace(
    /\$\{EXECUTION_ROOT\}/g,
    driver.getSandbox()
  );
  driver.writeFile("compile_commands.json", newCompileContents);
};

customLinterCheckTest({
  linterName: "include-what-you-use",
  args: "-a -y",
  pathsToSnapshot: ["test.cc"],
  versionGreaterThanOrEqual,
  preCheck,
});
