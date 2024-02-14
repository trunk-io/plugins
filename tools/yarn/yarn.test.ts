import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

toolTest({
  toolName: "yarn",
  toolVersion: "1.22.19",
  testConfigs: [
    makeToolTestConfig({
      command: ["yarn", "--version"],
      expectedOut: "1.22.19",
    }),
  ],
  skipTestIf: skipOS(["win32"]),
});
