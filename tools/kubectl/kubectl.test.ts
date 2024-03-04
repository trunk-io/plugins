import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

toolTest({
  toolName: "kubectl",
  toolVersion: "1.25.16",
  testConfigs: [
    makeToolTestConfig({
      command: ["kubectl", "version", "--short"],
      expectedOut: "Client Version: v1.25.16",
      // This fails on no kubectl credentials. Why do you need that for a version check? Who knows...
      expectedExitCode: 1,
    }),
  ],
  skipTestIf: skipOS(["win32"]),
});
