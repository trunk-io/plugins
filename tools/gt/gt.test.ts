import { makeToolTestConfig, toolTest } from "tests";
import { skipCPUOS } from "tests/utils";

toolTest({
  toolName: "gt",
  toolVersion: "0.20.19",
  testConfigs: [makeToolTestConfig({ command: ["gt", "--version"], expectedOut: "0.20.19" })],
  skipTestIf: skipCPUOS([{ os: "linux", cpu: "arm64" }]),
});

toolTest({
  toolName: "gt-1",
  toolVersion: "1.0.0",
  testConfigs: [makeToolTestConfig({ command: ["gt", "--version"], expectedOut: "1.0.0" })],
  skipTestIf: skipCPUOS([{ os: "linux", cpu: "arm64" }]),
});
