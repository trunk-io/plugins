import { toolTest } from "tests";

toolTest({
  toolName: "helm", // toolName
  toolVersion: "3.9.4", // version
  testConfigs: [
    {
      command: ["helm", "version"],
      expectedExitCode: 0,
      expectedOut: `version.BuildInfo{Version:"v3.9.4"`,
      expectedErr: "",
    },
  ],
});
