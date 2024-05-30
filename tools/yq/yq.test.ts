import { makeToolTestConfig, toolTest } from "tests";

// The binary name varies by platform so we can't roll this into a health_check as-is.
toolTest({
  toolName: "yq",
  toolVersion: "4.40.5",
  testConfigs: [makeToolTestConfig({ command: ["yq", "--version"], expectedOut: "v4.40.5" })],
});
