import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

toolTest({
  toolName: "assh",
  toolVersion: "2.15.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["assh", "--version"],
      expectedOut: "assh version n/a (n/a)",
    }),
  ],
  skipTestIf: skipOS(["win32"]),
});
