import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "bazel",
  toolVersion: "6.0.0",
  testConfigs: [
    makeToolTestConfig({ command: ["bazel", "--version"], expectedOut: "bazel 6.0.0" }),
  ],
});
