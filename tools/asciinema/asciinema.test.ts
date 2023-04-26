import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "asciinema",
  toolVersion: "2.1.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["asciinema", "--version"],
      expectedOut: "asciinema 2.1.0",
    }),
  ],
});
