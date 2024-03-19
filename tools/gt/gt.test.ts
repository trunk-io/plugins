import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

toolTest({
  toolName: "gt",
  toolVersion: "1.0.7",
  testConfigs: [makeToolTestConfig({ command: ["gt", "--version"], expectedOut: "1.0.7" })],
  skipTestIf: skipOS(["win32"]),
});
