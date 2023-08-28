import { makeToolTestConfig, toolTest } from "tests";
toolTest({
  toolName: "aws-amplify",
  toolVersion: "12.3.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["amplify", "version"],
      expectedOut: "12.3.0",
    }),
  ],
});
