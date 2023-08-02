import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "act",
  toolVersion: "0.2.49",
  testConfigs: [
    makeToolTestConfig({
      command: ["act", "--version"],
      expectedOut: "act version 0.2.49",
    }),
  ],
});
