import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "gk",
  toolVersion: "1.2.2",
  testConfigs: [
    makeToolTestConfig({
      command: ["gk", "version"],
      expectedOut: "v1.2.2",
    }),
  ],
});
