import path from "path";
import { customLinterCheckTest, linterFmtTest } from "tests";
import { skipOS, TEST_DATA } from "tests/utils";

linterFmtTest({ linterName: "remark-lint" });

// TODO(Tyler): Fix custom parsers sometimes breaking on Mac
customLinterCheckTest({
  linterName: "remark-lint",
  args: path.join(TEST_DATA, "basic.in.md"),
  skipTestIf: skipOS(["darwin"]),
});
