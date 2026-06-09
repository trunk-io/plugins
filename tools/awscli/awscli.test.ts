import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

toolTest({
  toolName: "awscli",
  toolVersion: "1.40.22",
  testConfigs: [
    makeToolTestConfig({
      command: ["aws", "--version"],
      expectedOut: "aws-cli/1.40.22",
    }),
  ],
  // On Windows, the shim is aws.cmd, and we don't support platform-specific shims yet.
  // To use on Windows, override the shim with aws.cmd.
  skipTestIf: skipOS(["win32"]),
});
