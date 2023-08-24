import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

toolTest({
  toolName: "adr",
  toolVersion: "3.0.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["adr", "help"],
      expectedOut: "adr help COMMAND [ARG]",
    }),
  ],
  skipTestIf: skipOS(["win32"]),
});
