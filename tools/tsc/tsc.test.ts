import { makeToolTestConfig, toolInstallTest, toolTest } from "tests";
toolTest({
  toolName: "tsc",
  toolVersion: "5.2.2",
  testConfigs: [
    makeToolTestConfig({
      command: ["tsc", "--version"],
      expectedOut: "Version 5.2.2",
    }),
  ],
});

toolInstallTest({
  toolName: "tsc",
  toolVersion: "5.2.2",
});
