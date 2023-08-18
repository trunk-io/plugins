import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "sfdx",
  toolVersion: "2.0.1",
  testConfigs: [
    makeToolTestConfig({
      command: ["sfdx", "--version"],
      expectedOut: "2.0.1",
    }),
    makeToolTestConfig({
      command: ["sf", "--version"],
      expectedOut: "2.0.1",
    }),
  ],
});
