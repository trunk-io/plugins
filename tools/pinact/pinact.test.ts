import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

toolTest({
  toolName: "pinact",
  toolVersion: "3.9.2",
  testConfigs: [makeToolTestConfig({ command: ["pinact", "version"], expectedOut: "3.9.2" })],
  skipTestIf: skipOS(["win32"]),
});
