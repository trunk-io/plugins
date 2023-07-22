import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "bazel-differ",
  toolVersion: "0.0.5",
  testConfigs: [
    makeToolTestConfig({
      command: ["bazel-differ", "--help"],
      expectedOut: "bazel-differ is a CLI tool to assist with doing differential Bazel builds",
    }),
  ],
});
