import { makeToolTestConfig, toolTest } from "tests";
toolTest({
  toolName: "terraformer",
  toolVersion: "0.8.24",
  testConfigs: [
    makeToolTestConfig({
      command: ["terraformer", "--version"],
      expectedOut: "version v0.8.24",
    }),
  ],
});
