import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "gt",
  toolVersion: "v0.20.19",
  testConfigs: [makeToolTestConfig({ command: ["gt", "--version"], expectedOut: "0.20.19" })],
});
