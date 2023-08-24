import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "eksctl",
  toolVersion: "0.74.0",
  testConfigs: [makeToolTestConfig({ command: ["eksctl", "version"], expectedOut: "0.74.0" })],
});
