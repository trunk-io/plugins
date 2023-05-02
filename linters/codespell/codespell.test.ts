import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";

customLinterCheckTest({ linterName: "codespell", testName: "basic", args: "-a" });

const preCheck = (driver: TrunkLintDriver) => {
  driver.writeFile(".codespellrc", "[codespell]\nignore-words-list = callbak,realy");
};

customLinterCheckTest({ linterName: "codespell", testName: "dictionary", args: "-a", preCheck });
