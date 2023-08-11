import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

toolTest({
  toolName: "asciinema",
  toolVersion: "2.1.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["asciinema", "--version"],
      expectedOut: "asciinema 2.1.0",
    }),
  ],
  skipTestIf: skipOS(["win32"]),
});
