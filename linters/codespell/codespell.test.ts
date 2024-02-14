import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

customLinterCheckTest({ linterName: "codespell", testName: "basic", args: TEST_DATA });

const preCheck = (driver: TrunkLintDriver) => {
  driver.writeFile(".codespellrc", "[codespell]\nignore-words-list = callbak,realy");
};

customLinterCheckTest({
  linterName: "codespell",
  testName: "dictionary",
  args: TEST_DATA,
  preCheck,
});
