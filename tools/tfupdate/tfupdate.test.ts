import { makeToolTestConfig, toolTest } from "tests";
toolTest({
  toolName: "tfupdate",
  toolVersion: "0.7.2",
  testConfigs: [
    makeToolTestConfig({
      command: ["tfupdate", "--version"],
      expectedOut: "0.7.2",
    }),
  ],
});
