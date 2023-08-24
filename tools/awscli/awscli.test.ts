import { makeToolTestConfig, toolTest } from "tests";
toolTest({
  toolName: "awscli",
  toolVersion: "1.29.30",
  testConfigs: [
    makeToolTestConfig({
      command: ["aws", "--version"],
      expectedOut: "aws-cli/1.29.30",
    }),
  ],
});
