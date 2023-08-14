import { makeToolTestConfig, toolTest } from "tests";
toolTest({
  toolName: "terraform-switcher",
  toolVersion: "0.13.1308",
  testConfigs: [
    makeToolTestConfig({
      command: ["tfswitch", "--version"],
      expectedOut: "Version: 0.13.1308",
    }),
  ],
});
