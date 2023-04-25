import { toolTest } from "tests";

toolTest({
  toolName: "target-determinator", // toolName
  toolVersion: "0.3.0", // version
  testConfigs: [
    {
      command: ["target-determinator"],
      expectedExitCode: 1,
      expectedErr:
        "Failed to parse flags: expected one positional argument, <before-revision>, but got 0",
      expectedOut: "",
    },
  ],
});
