import { makeToolTestConfig, toolTest } from "tests";
import { skipCPUOS, skipOS } from "tests/utils";

toolTest({
  toolName: "gt",
  toolVersion: "0.20.19",
  testConfigs: [makeToolTestConfig({ command: ["gt", "--version"], expectedOut: "0.20.19" })],
  skipTestIf: skipCPUOS([{ os: "linux", cpu: "arm64" }]),
});

toolTest({
  toolName: "gt",
  toolVersion: "1.0.7",
  testConfigs: [makeToolTestConfig({ command: ["gt", "--version"], expectedOut: "1.0.7" })],
  skipTestIf: skipOS(["win32"]),
});
