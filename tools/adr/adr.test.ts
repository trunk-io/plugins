import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "adr",
  toolVersion: "3.0.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["adr", "help"],
      expectedOut: "adr help COMMAND [ARG]",
    }),
  ],
});
