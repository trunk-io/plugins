import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "alp",
  toolVersion: "1.0.14",
  testConfigs: [
    makeToolTestConfig({
      command: ["alp", "-v"],
      expectedOut: "1.0.14",
    }),
  ],
});
