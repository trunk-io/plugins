import { customLinterCheckTest } from "tests";
import { osTimeoutMultiplier, TEST_DATA } from "tests/utils";

jest.setTimeout(600000 * osTimeoutMultiplier);

customLinterCheckTest({
  linterName: "renovate",
  args: TEST_DATA,
});
