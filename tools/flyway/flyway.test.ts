import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "flyway",
  toolVersion: "11.9.2",
  testConfigs: [
    makeToolTestConfig({
      command: ["flyway", "--version"],
      expectedOut: "Flyway Community Edition 11.9.2",
    }),
  ],
});
