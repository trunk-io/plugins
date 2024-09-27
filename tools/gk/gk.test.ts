import { makeToolTestConfig, toolTest } from "tests";

// No version command for gk
toolTest({
  toolName: "gk",
  toolVersion: "1.2.2",
  testConfigs: [makeToolTestConfig({ command: ["gk", "-h"], expectedErr: "Usage" })],
});
