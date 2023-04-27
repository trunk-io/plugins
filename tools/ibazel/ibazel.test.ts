import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "ibazel",
  toolVersion: "0.22.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["ibazel"],
      expectedErr: "iBazel - Version v0.22.0",
    }),
  ],
});
