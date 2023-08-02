import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "air",
  toolVersion: "1.44.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["air", "--v"],
      expectedOut: "1.44.0",
    }),
  ],
});
