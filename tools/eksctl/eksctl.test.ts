import { toolTest } from "tests";

toolTest({
  toolName: "eksctl", // toolName
  toolVersion: "0.74.0", // version
  testConfigs: [
    { command: ["eksctl", "version"], expectedExitCode: 0, expectedOut: "0.74.0", expectedErr: "" },
  ],
});
