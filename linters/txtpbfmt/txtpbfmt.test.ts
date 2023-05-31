import path from "path";
import { customLinterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";

customLinterCheckTest({
  linterName: "txtpbfmt",
  testName: "basic_check",
});

customLinterCheckTest({
  linterName: "txtpbfmt",
  testName: "basic_lint_test",
  pathsToSnapshot: [path.join(TEST_DATA, "test0.textproto"), path.join(TEST_DATA, "test1.textpb")],
  versionGreaterThanOrEqual: (_a: string, _b: string) => true,
});
