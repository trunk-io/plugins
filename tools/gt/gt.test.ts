import { makeToolTestConfig, toolTest } from "tests";
import { skipCPUOS } from "tests/utils";

toolTest({
  toolName: "gt",
  toolVersion: "0.20.19",
  testConfigs: [makeToolTestConfig({ command: ["gt", "--version"], expectedOut: "0.20.19" })],
  skipTestIf: skipCPUOS(["linux"], ["arm64"]),
});
