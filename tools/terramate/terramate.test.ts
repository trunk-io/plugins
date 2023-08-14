import { makeToolTestConfig, toolTest } from "tests";
toolTest({
  toolName: "terramate",
  toolVersion: "0.4.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["terramate", "--version"],
      expectedOut: "0.4.0",
    }),
  ],
});
