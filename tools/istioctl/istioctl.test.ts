import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "istioctl",
  toolVersion: "1.14.6",
  testConfigs: [
    makeToolTestConfig({
      command: ["istioctl", "version"],
      expectedOut: "1.14.6",
    }),
  ],
});
