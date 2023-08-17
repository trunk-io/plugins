import path from "path";
import { customLinterFmtTest } from "tests";
import { TEST_DATA } from "tests/utils";

// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes.
customLinterFmtTest({
  linterName: "dotnet-format",
  args: "-a",
  pathsToSnapshot: [
    path.join(TEST_DATA, "basic/basic.in.cs"),
    path.join(TEST_DATA, "basic/Program.cs"),
  ],
});
