import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

toolTest({
  toolName: "air",
  toolVersion: "1.44.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["air", "--v"],
      expectedOut: "1.44.0",
    }),
  ],
  skipTestIf: skipOS(["win32"]),
});
