import { customLinterCheckTest } from "tests";
import { osTimeoutMultiplier, TEST_DATA } from "tests/utils";

jest.setTimeout(600000 * osTimeoutMultiplier); // 300s or 900s

customLinterCheckTest({
  linterName: "renovate",
  args: TEST_DATA,
});
