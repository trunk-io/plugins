import path from "path";
import { customLinterFmtTest } from "tests";
import { skipOS, TEST_DATA } from "tests/utils";

customLinterFmtTest({
  linterName: "swiftformat",
  args: "-a",
  pathsToSnapshot: [path.join(TEST_DATA, "basic.swift")],
  skipTestIf: skipOS(["linux"]),
});
