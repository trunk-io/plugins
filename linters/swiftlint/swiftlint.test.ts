import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { skipOS, TEST_DATA } from "tests/utils";

customLinterCheckTest({
  linterName: "swiftlint",
  testName: "basic",
  args: TEST_DATA,
  skipTestIf: skipOS(["linux", "win32"]),
});

const configSetup = (driver: TrunkLintDriver) => {
  // top-level config 1. This is used as the base for all nested configs.
  driver.writeFile(
    ".trunk/configs/.swiftlint.yml",
    `disabled_rules:
  - line_length
  - identifier_name`,
  );

  // nested config 2. Files in its directory should apply configs 1 and 2
  driver.writeFile(
    "test_data/.swiftlint.yml",
    `disabled_rules:
  - type_name`,
  );

  // nested config 3. Files in its directory should apply configs 1 and 3
  driver.writeFile(
    "test_data/subdir/.swiftlint.yml",
    `disabled_rules:
  - vertical_whitespace`,
  );

  // Include 3 copies of basic.swift:
  // - basic.swift (config 1)
  // - test_data/basic.swift (config 1 and 2)
  // - test_data/subdir/basic.swift (config 1 and 3)
  driver.copyFile("test_data/basic.swift", "basic.swift");
  driver.copyFile("basic.swift", "test_data/subdir/basic.swift");
};

customLinterCheckTest({
  linterName: "swiftlint",
  testName: "nested_configs",
  args: "-a",
  skipTestIf: skipOS(["linux", "win32"]),
  preCheck: configSetup,
});
