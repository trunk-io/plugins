import { toolTest } from "tests";

toolTest({
  toolName: "bazel", // toolName
  toolVersion: "6.0.0", // version
  testConfigs: [
    {
      command: ["bazel", "--version"],
      expectedExitCode: 0,
      expectedOut: "bazel 6.0.0",
      expectedErr: "",
    },
  ],
});
