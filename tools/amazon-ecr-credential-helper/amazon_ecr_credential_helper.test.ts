import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

toolTest({
  toolName: "amazon-ecr-credential-helper",
  toolVersion: "0.7.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["amazon-ecr-credential-helper"],
      expectedOut: "Usage: amazon-ecr-credential-helper <store|get|erase|list|version>",
      expectedExitCode: 1,
    }),
  ],
  skipTestIf: skipOS(["win32"]),
});
