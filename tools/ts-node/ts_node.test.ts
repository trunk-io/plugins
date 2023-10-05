import { makeToolTestConfig, toolTest } from "tests";
toolTest({
  toolName: "ts-node",
  toolVersion: "10.9.1",
  testConfigs: [
    makeToolTestConfig({
      command: ["ts-node", "version"],
      expectedOut: "10.9.1",
    }),
  ],
});
