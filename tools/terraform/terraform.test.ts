import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "terraform",
  toolVersion: "1.4.6",
  testConfigs: [
    makeToolTestConfig({
      command: ["terraform", "-version"],
      expectedOut: "Terraform v1.4.6",
    }),
  ],
});
