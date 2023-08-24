import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";
toolTest({
  toolName: "direnv",
  toolVersion: "2.32.3",
  testConfigs: [
    makeToolTestConfig({
      command: ["direnv", "--version"],
      expectedOut: "2.32.3",
    }),
  ],
  skipTestIf: skipOS(["win32"]),
});
