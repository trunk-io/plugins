import path from "path";
import { customLinterCheckTest, TestCallback } from "tests";
import { TEST_DATA } from "tests/utils";

const preCheck: TestCallback = (driver) => {
  driver.moveFile(path.join(TEST_DATA, "go.mod"), "go.mod");
};

customLinterCheckTest({ linterName: "gokart", args: `${TEST_DATA} -y`, preCheck });
