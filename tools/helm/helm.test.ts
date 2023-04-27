import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "helm",
  toolVersion: "3.9.4",
  testConfigs: [
    makeToolTestConfig({
      command: ["helm", "version"],
      expectedOut: 'version.BuildInfo{Version:"v3.9.4"',
    }),
  ],
});
