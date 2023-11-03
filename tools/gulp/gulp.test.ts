import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "gulp",
  toolVersion: "4.0.2",
  testConfigs: [
    makeToolTestConfig({
      command: ["gulp", "--version"],
      expectedOut: "Local version: 4.0.2",
    }),
  ],
});
