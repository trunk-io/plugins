import path from "path";
import { customLinterFmtTest } from "tests";
import { skipOS, TEST_DATA } from "tests/utils";

// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes.
customLinterFmtTest({
  linterName: "dotnet-format",
  args: TEST_DATA,
  pathsToSnapshot: [
    path.join(TEST_DATA, "basic/basic.in.cs"),
    path.join(TEST_DATA, "basic/Program.cs"),
    path.join(TEST_DATA, "second_one/Program.cs"),
  ],
  // TODO(Tyler): There is an issue where the M1 Mac dotnet-format execution causes Trunk to hang on first run.
  // Disable this test until we can iron out the cause.
  skipTestIf: skipOS(["darwin"]),
});
