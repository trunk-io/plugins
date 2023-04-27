import { linterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";

// Grab the root .prettierrc.yaml
const preCheck = (driver: TrunkLintDriver) => {
  driver.writeFile(
    ".trunk/configs/.prettierrc.yaml",
    `printWidth: 100
proseWrap: always`
  );
};

// TODO(Tyler): We will eventually need to add a couple more test cases involving other file types.
linterFmtTest({ linterName: "prettier", preCheck });
