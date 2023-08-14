import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";
toolTest({
  toolName: "tfmigrate",
  toolVersion: "0.3.14",
  testConfigs: [
    makeToolTestConfig({
      command: ["tfmigrate", "--version"],
      expectedOut: "0.3.14",
    }),
  ],
  skipTestIf: skipOS(["win32"]),
});
