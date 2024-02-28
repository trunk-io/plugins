import { makeToolTestConfig, toolTest } from "tests";
toolTest({
  toolName: "pwsh",
  toolVersion: "7.4.1",
  testConfigs: [
    makeToolTestConfig({
      command: ["pwsh", "--version"],
      expectedOut: "PowerShell 7.4.1",
    }),
  ],
});
