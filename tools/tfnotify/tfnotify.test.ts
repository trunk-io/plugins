import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

toolTest({
  toolName: "tfnotify",
  toolVersion: "0.8.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["tfnotify", "--version"],
      expectedOut: "tfnotify version unset",
    }),
  ],
  skipTestIf: skipOS(["win32"]),
});
