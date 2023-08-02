import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "agebox",
  toolVersion: "0.6.1",
  testConfigs: [
    makeToolTestConfig({
      command: ["agebox", "--version"],
      expectedErr: "v0.6.1",
    }),
  ],
});
