import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "1password-cli",
  toolVersion: "2.19.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["op", "--version"],
      expectedOut: "2.19.0",
    }),
  ],
});
