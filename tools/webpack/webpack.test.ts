import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "webpack",
  toolVersion: "5.89.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["webpack", "--version"],
      expectedOut: "Binaries:",
    }),
  ],
});
