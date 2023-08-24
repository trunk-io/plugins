import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

// TODO(lauri): unclear why this doesn't work on macOS on test runners - it works locally
toolTest({
  toolName: "istioctl",
  toolVersion: "1.14.6",
  testConfigs: [
    makeToolTestConfig({
      command: ["istioctl", "version"],
      expectedOut: "1.14.6",
    }),
  ],
  skipTestIf: skipOS(["darwin", "win32"]),
});
