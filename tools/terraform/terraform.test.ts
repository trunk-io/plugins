import { makeToolTestConfig, toolTest } from "tests";
toolTest({
  toolName: "terraform",
  toolVersion: "1.1.4",
  testConfigs: [
    makeToolTestConfig({
      command: ["terraform", "--version"],
      expectedOut: "Terraform v1.1.4",
    }),
  ],
});
