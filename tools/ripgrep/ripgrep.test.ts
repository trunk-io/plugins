import { makeToolTestConfig, toolTest } from "tests";
toolTest({
  toolName: "ripgrep",
  toolVersion: "13.0.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["rg", "--version"],
      expectedOut: "ripgrep 13.0.0",
    }),
  ],
});
