import path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { skipOS, TEST_DATA } from "tests/utils";

const preCheck = (copyConfig: boolean) => (driver: TrunkLintDriver) => {
  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);
  // Because clang-tidy requires greater build-level awareness for full functionality,
  // This test provides some simple overrides to exercise the basic functionality.
  const newContents = currentContents.concat(`  compile_commands_roots:
  - test_data
  definitions:
    - name: clang-tidy
      files: [c++-header, c++-source]
      commands:
        - name: lint
          disable_upstream: true
          run: clang-tidy --export-fixes=- \${target}
          read_output_from: stdout
      query_compile_commands: false
      include_scanner_type: none`);
  driver.writeFile(trunkYamlPath, newContents);

  if (copyConfig) {
    driver.moveFile(path.join(TEST_DATA, ".clang-tidy"), ".clang-tidy");
  }

  // Resolve templates in compile_commands.json
  const compileCommandsPath = path.join(TEST_DATA, "compile_commands.json");
  const compileContents = driver.readFile(compileCommandsPath);
  const newCompileContents = compileContents.replace(
    /\$\{EXECUTION_ROOT\}/g,
    path.resolve(driver.getSandbox(), TEST_DATA),
  );
  driver.writeFile(compileCommandsPath, newCompileContents);
};

// Use both configs for a bit more coverage of different config cases.
customLinterCheckTest({
  linterName: "clang-tidy",
  testName: "default_config",
  args: `${TEST_DATA} --cache=false`,
  preCheck: preCheck(false),
  skipTestIf: skipOS(["win32"]),
});
customLinterCheckTest({
  linterName: "clang-tidy",
  testName: "test_config",
  args: `${TEST_DATA} --cache=false`,
  preCheck: preCheck(true),
  skipTestIf: skipOS(["win32"]),
});
