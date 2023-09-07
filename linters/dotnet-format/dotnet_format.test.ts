import path from "path";
import { customLinterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

const preCheck = async (driver: TrunkLintDriver) => {
  await driver.runTrunk(["tools", "enable", "dotnet"]);
};

// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes.
customLinterFmtTest({
  linterName: "dotnet-format",
  args: "-a",
  preCheck,
  pathsToSnapshot: [
    path.join(TEST_DATA, "basic/basic.in.cs"),
    path.join(TEST_DATA, "basic/Program.cs"),
    path.join(TEST_DATA, "second_one/Program.cs"),
  ],
});
