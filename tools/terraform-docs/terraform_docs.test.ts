import { makeToolTestConfig, toolTest } from "tests";
toolTest({
  toolName: "terraform-docs",
  toolVersion: "0.16.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["terraform-docs", "--version"],
      expectedOut: "terraform-docs version v0.16.0",
    }),
  ],
});
