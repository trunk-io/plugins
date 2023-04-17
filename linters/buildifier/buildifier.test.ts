import path from "path";
import { customLinterFmtTest, linterCheckTest, linterFmtTest } from "tests";
import { TrunkDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

const writeConfigs = (driver: TrunkDriver) => {
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
linterCheckTest({ linterName: "buildifier" });
linterFmtTest({ linterName: "buildifier" });
customLinterFmtTest({
  linterName: "buildifier",
  args: "-a",
  testName: "withConfig",
  pathsToSnapshot: [path.join(TEST_DATA, "add_tables.in.BUILD")],
  preCheck: writeConfigs,
});
