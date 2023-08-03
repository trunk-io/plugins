import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

toolTest({
  toolName: "1password-cli",
  toolVersion: "2.19.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["op", "--version"],
      expectedOut: "2.19.0",
    }),
  ],
  skipTestIf: skipOS(["darwin"]),
});
