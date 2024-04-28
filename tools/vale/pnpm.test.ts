import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "vale",
  toolVersion: "3.4.1",
  testConfigs: [
    makeToolTestConfig({ command: ["vale", "--version"], expectedOut: "vale version 3.4.1" }),
  ],
});
