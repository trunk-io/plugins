import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "age",
  toolVersion: "1.1.1",
  testConfigs: [
    makeToolTestConfig({
      command: ["age", "--version"],
      expectedOut: "v1.1.1",
    }),
    makeToolTestConfig({
      command: ["age-keygen", "--version"],
      expectedOut: "v1.1.1",
    }),
  ],
});
