import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

toolTest({
  toolName: "act",
  toolVersion: "0.2.49",
  testConfigs: [
    makeToolTestConfig({
      command: ["act", "--version"],
      expectedOut: "act version 0.2.49",
    }),
  ],
  // No download for the test version
  skipTestIf: skipOS(["win32"]),
});
