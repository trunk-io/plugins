import { toolTest } from "tests";

// TODO(lauri): iBazel is doing something wacky with writing to
toolTest({
  toolName: "ibazel", // toolName
  toolVersion: "0.22.0", // version
  testConfigs: [
    {
      command: ["ibazel"],
      expectedExitCode: 0,
      expectedOut: "",
      expectedErr: "iBazel - Version v0.22.0",
    },
  ],
});
