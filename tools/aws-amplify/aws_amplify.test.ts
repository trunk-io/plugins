import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

toolTest({
  toolName: "aws-amplify",
  toolVersion: "12.3.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["amplify", "version"],
      expectedOut: "12.3.0",
    }),
  ],
  // On Windows, the shim is amplify.cmd, and we don't support platform-specific shims yet.
  // To use on Windows, override the shim with amplify.cmd.
  skipTestIf: skipOS(["win32"]),
});
