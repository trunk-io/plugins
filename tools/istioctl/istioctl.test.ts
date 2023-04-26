import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

toolTest({
  toolName: "istioctl",
  toolVersion: "1.14.6",
  testConfigs: [
    makeToolTestConfig({
      command: ["istioctl", "version"],
      expectedOut: "1.14.6",
    }),
  ],
  skipTestIf: skipOS(["darwin"]),
});
