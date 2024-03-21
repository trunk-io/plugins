import { makeToolTestConfig, toolTest } from "tests";
toolTest({
  toolName: "tofu",
  toolVersion: "1.6.2",
  testConfigs: [
    makeToolTestConfig({
      command: ["tofu", "--version"],
      expectedOut: "OpenTofu v1.6.2",
    }),
  ],
});
