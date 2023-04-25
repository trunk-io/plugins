import { toolTest } from "tests";

toolTest({
  toolName: "istioctl", // toolName
  toolVersion: "1.14.6", // version
  testConfigs: [
    {
      command: ["istioctl", "version"],
      expectedExitCode: 0,
      expectedOut: "1.14.6",
      expectedErr: "",
    },
  ],
});
