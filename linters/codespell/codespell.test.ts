import { customLinterCheckTest, TestCallback } from "tests";

customLinterCheckTest({ linterName: "codespell", testName: "basic", args: "-a" });

const preCheck: TestCallback = (driver) => {
  driver.writeFile(".codespellrc", "[codespell]\nignore-words-list = callbak,realy");
};

customLinterCheckTest({ linterName: "codespell", testName: "dictionary", args: "-a", preCheck });
