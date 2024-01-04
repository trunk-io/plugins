import { customLinterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";

customLinterCheckTest({
  linterName: "circleci",
  args: TEST_DATA,
});
