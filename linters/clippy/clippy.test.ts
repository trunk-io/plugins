import path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

// trunk-ignore-all(semgrep)
// Ensure that the Cargo files are at the same level as the src/ directory.
const moveCargoFiles = (dest: string) => (driver: TrunkLintDriver) => {
  ["Cargo.lock", "Cargo.toml"].forEach((file) => {
    driver.moveFile(path.join(TEST_DATA, file), path.join(dest, file));
  });
};

// clippy relies on a repo's Cargo setup, and therefore requires a relatively complex configuration for testing purposes.
const preCheckSrc = (subdir: string) => (driver: TrunkLintDriver) => {
  moveCargoFiles(".")(driver);
  driver.moveFile(path.join(TEST_DATA, subdir), "src");
};

["basic", "complex", "malformed"].forEach((target) => {
  customLinterCheckTest({
    linterName: "clippy",
    testName: target,
    args: "src -y",
    preCheck: preCheckSrc(target),
    pathsToSnapshot: ["src/main.rs"],
  });
});

["complex_subdir", "malformed_subdir"].forEach((target) => {
  const subdir = path.join(TEST_DATA, target);
  customLinterCheckTest({
    linterName: "clippy",
    testName: target,
    args: `${subdir} -y`,
    preCheck: moveCargoFiles(subdir),
  });
});
