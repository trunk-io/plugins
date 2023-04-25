import { toolTest } from "tests";

toolTest({
  toolName: "sentry-cli", // toolName
  toolVersion: "1.66.0", // version
  testConfigs: [
    {
      command: ["sentry-cli", "-V"],
      expectedExitCode: 0,
      expectedOut: "sentry-cli 1.66.0",
      expectedErr: "",
    },
  ],
});
