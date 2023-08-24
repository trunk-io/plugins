import { makeToolTestConfig, toolTest } from "tests";
toolTest({
  toolName: "sourcery",
  toolVersion: "1.2.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["sourcery", "--version"],
      expectedOut: "1.2.0",
    }),
  ],
});
