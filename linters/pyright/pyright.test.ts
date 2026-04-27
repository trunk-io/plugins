import { linterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";

const preCheck = (driver: TrunkLintDriver) => {
  driver.writeFile(
    ".trunk/configs/pyrightconfig.json",
    JSON.stringify(
      {
        pythonVersion: "3.10",
      },
      null,
      2,
    ),
  );
};

linterCheckTest({ linterName: "pyright", preCheck });
