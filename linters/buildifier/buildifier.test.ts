import path from "path";
import { customLinterFmtTest, linterCheckTest } from "tests";
import { TrunkDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

const preFmt = (driver: TrunkDriver) => {
  const buildifierTablesContents = `
{
  "IsLabelArg": {},
  "LabelDenylist": {},
  "IsSortableListArg": {
    "fizz": true
  },
  "SortableAllowlist": {},
  "NamePriority": {}
}
  `;

  driver.moveFile(".buildifier.json", ".trunk/configs/.buildifier.json");
  driver.deleteFile(".buildifier-tables.json");
  driver.writeFile(".trunk/configs/.buildifier-tables.json", buildifierTablesContents);
};

// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes.
linterCheckTest({ linterName: "buildifier" });
customLinterFmtTest({
  linterName: "buildifier",
  args: "-a",
  testName: "add_tables",
  pathsToSnapshot: [path.join(TEST_DATA, "add_tables.in.BUILD")],
  preCheck: preFmt,
});
