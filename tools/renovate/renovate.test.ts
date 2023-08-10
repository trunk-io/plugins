import { makeToolTestConfig, toolTest } from "tests";
toolTest({
  toolName: "renovate",
  toolVersion: "34.122.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["renovate", "--version"],
      expectedOut: "34.122.0",
    }),
  ],
});
