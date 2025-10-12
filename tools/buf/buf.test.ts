import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "buf",
  toolVersion: "1.55.1",
  testConfigs: [
    makeToolTestConfig({
      command: ["buf", "--version"],
      expectedOut: "1.55.1",
    }),
  ],
});
