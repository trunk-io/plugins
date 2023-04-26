import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "sentry-cli",
  toolVersion: "1.66.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["sentry-cli", "-V"],
      expectedOut: "sentry-cli 1.66.0",
    }),
  ],
});
