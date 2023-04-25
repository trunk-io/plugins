import path from "path";
import { customLinterCheckTest, customLinterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

const writeConfigs = (driver: TrunkLintDriver) => {
  const buildifierContents = `
{
  "documentation for humans": {
    "What": "This file provides buildifier configuration.",
    "See": "https://github.com/bazelbuild/buildtools/blob/master/buildifier/config/config.go"
  },
  "addTables": ".buildifier-tables.json",
  "warnings": "all"
}
  `;
  const buildifierTablesContents = `
{
  "documentation for humans": {
    "What": "This file provides buildifier configuration.",
    "See": "https://github.com/bazelbuild/buildtools/blob/master/tables/tables.go"
  },
  "IsLabelArg": {},
  "LabelDenylist": {},
  "IsSortableListArg": {
    "fizz": true
  },
  "SortableAllowlist": {},
  "NamePriority": {}
}
  `;

  driver.writeFile(".trunk/configs/.buildifier.json", buildifierContents);
  driver.writeFile(".trunk/configs/.buildifier-tables.json", buildifierTablesContents);
};

// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes.
customLinterCheckTest({
  linterName: "buildifier",
  args: "-a",
  testName: "basic_check",
});

customLinterFmtTest({
  linterName: "buildifier",
  args: "-a",
  testName: "no_config",
  pathsToSnapshot: [path.join(TEST_DATA, "basic.bzl"), path.join(TEST_DATA, "add_tables.BUILD")],
});
customLinterFmtTest({
  linterName: "buildifier",
  args: "-a",
  testName: "with_config",
  pathsToSnapshot: [path.join(TEST_DATA, "add_tables.BUILD")],
  preCheck: writeConfigs,
});
