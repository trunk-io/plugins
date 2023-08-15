import { makeToolTestConfig, toolTest } from "tests";
toolTest({
  toolName: "circleci",
  toolVersion: "0.1.22770",
  testConfigs: [
    makeToolTestConfig({
      command: ["circleci", "version"],
      expectedOut: "0.1.22770",
    }),
  ],
});
