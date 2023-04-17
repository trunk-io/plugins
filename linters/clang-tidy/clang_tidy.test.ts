import * as fs from "fs";
import path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

const preCheck = (copyConfig: boolean) => (driver: TrunkDriver) => {
  if (!copyConfig) {
    // TODO(Tyler): We need to have the option to copy the direct config into the root rather than symlink
    driver.moveFile(".trunk/configs/.clang-tidy", ".clang-tidy");
  }
  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);
  // Because clang-tidy requires greater build-level awareness for full functionality,
  // This test provides some simple overrides to exercise the basic functionality.
  const newContents = currentContents.concat(`  definitions:
    - name: clang-tidy
      commands:
        - name: lint
          disable_upstream: true
          run: clang-tidy --export-fixes=- \${target}
          read_output_from: stdout
      query_compile_commands: false
      include_scanner_type: none`);
  driver.writeFile(trunkYamlPath, newContents);

  // Move files to root
  // trunk-ignore-begin(semgrep): paths used here are safe
  fs.readdirSync(path.resolve(driver.getSandbox(), TEST_DATA)).forEach((file) => {
    if (file !== ".clang-tidy" || copyConfig) {
      driver.moveFile(path.join(TEST_DATA, file), file);
    }
  });
  // trunk-ignore-end(semgrep)

  // Resolve templates in compile_commands.json
  const compileContents = driver.readFile("compile_commands.json");
  const newCompileContents = compileContents.replace(/\$\{EXECUTION_ROOT\}/g, driver.getSandbox());
  driver.writeFile("compile_commands.json", newCompileContents);
};

// Use both configs for a bit more coverage of different config cases.
customLinterCheckTest({
  linterName: "clang-tidy",
  testName: "default_config",
  args: "-a",
  preCheck: preCheck(false),
});
customLinterCheckTest({
  linterName: "clang-tidy",
  testName: "test_config",
  args: "-a",
  preCheck: preCheck(true),
});
