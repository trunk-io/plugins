import * as path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { skipOS, TEST_DATA } from "tests/utils";

// iwyu doesn't use semver versioning, so we need to pass a custom callback.
// Examples of iwyu versions include 0.10, 0.19
const versionGreaterThanOrEqual = (a: string, b: string) => [a.split(".")] > [b.split(".")];

const preCheck = (driver: TrunkLintDriver) => {
  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);
  // Because include-what-you-use requires greater build-level awareness for full functionality, and we can't rely on certain
  // system-installed tools, this test provides some simple overrides to exercise the basic functionality.
  const newContents = currentContents.concat(`  compile_commands_roots:
    - ${TEST_DATA}
  definitions:
    - name: include-what-you-use
      commands:
        - name: lint
          run_from: \${compile_command}
          run: include-what-you-use -Xiwyu --no_fwd_decls \${compile_command}
          disable_upstream: true
          cache_results: false
      include_scanner_type: none
  compile_commands: json`);
  driver.writeFile(trunkYamlPath, newContents);

  // Resolve templates in compile_commands.json
  const compileCommandsPath = path.join(TEST_DATA, "compile_commands.json");
  const oldCompileContents = driver.readFile(compileCommandsPath);
  const newCompileContents = oldCompileContents.replace(
    /\$\{EXECUTION_ROOT\}/g,
    path.resolve(driver.getSandbox(), TEST_DATA),
  );
  driver.writeFile(compileCommandsPath, newCompileContents);
};

customLinterCheckTest({
  linterName: "include-what-you-use",
  args: "-a -y",
  pathsToSnapshot: [path.join(TEST_DATA, "test.cc")],
  versionGreaterThanOrEqual,
  preCheck,
  skipTestIf: skipOS(["win32"]),
});
