import { customLinterCheckTest } from "tests";
import { TrunkDriver } from "tests/driver";

customLinterCheckTest({ linterName: "codespell", testName: "basic", args: "-a" });

const preCheck = (driver: TrunkDriver) => {
  driver.writeFile(".codespellrc", "[codespell]\nignore-words-list = callbak,realy");
};

customLinterCheckTest({ linterName: "codespell", testName: "dictionary", args: "-a", preCheck });
