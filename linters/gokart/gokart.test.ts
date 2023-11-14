import path from "path";
import { customLinterCheckTest, TestCallback } from "tests";
import { TEST_DATA } from "tests/utils";

// TODO(Tyler): Address Go install issues
jest.retryTimes(2);

const preCheck: TestCallback = (driver) => {
  driver.moveFile(path.join(TEST_DATA, "go.mod"), "go.mod");
};

customLinterCheckTest({ linterName: "gokart", args: "-a -y", preCheck });
