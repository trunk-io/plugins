import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "yarn",
  toolVersion: "1.22.19",
  testConfigs: [
    makeToolTestConfig({
      command: ["yarn", "--version"],
      expectedOut: "1.22.19",
    }),
  ],
});
