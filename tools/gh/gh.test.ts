import { toolTest } from "tests";

toolTest({
  toolName: "gh", // toolName
  toolVersion: "2.27.0", // version
  testConfigs: [
    {
      command: ["gh", "--version"],
      expectedExitCode: 0,
      expectedOut: "gh version 2.27.0",
      expectedErr: "",
    },
  ],
});
