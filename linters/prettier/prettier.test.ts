import { linterFmtTest } from "tests";
import { TrunkDriver } from "tests/driver";

// Grab the root .prettierrc.yaml
const preCheck = (driver: TrunkDriver) => {
  driver.copyFileFromRoot(".trunk/configs/.prettierrc.yaml");
};

// TODO(Tyler): We will eventually need to add a couple more test cases involving other file types.
linterFmtTest({ linterName: "prettier", preCheck });
