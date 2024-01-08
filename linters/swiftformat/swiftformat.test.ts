import path from "path";
import { customLinterFmtTest } from "tests";
import { skipOS, TEST_DATA } from "tests/utils";

customLinterFmtTest({
  linterName: "swiftformat",
  testName: "basic",
  args: TEST_DATA,
  pathsToSnapshot: [path.join(TEST_DATA, "basic.swift")],
  skipTestIf: skipOS(["linux", "win32"]),
});
