import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "gh",
  toolVersion: "2.27.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["gh", "--version"],
      expectedOut: "gh version 2.27.0",
    }),
  ],
});
