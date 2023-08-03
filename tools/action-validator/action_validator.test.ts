import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "action-validator",
  toolVersion: "0.5.3",
  testConfigs: [
    makeToolTestConfig({
      command: ["action-validator", "--version"],
      expectedOut: "action-validator 0.5.3",
    }),
  ],
});
