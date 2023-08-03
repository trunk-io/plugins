import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "assh",
  toolVersion: "2.15.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["assh", "--version"],
      expectedOut: "assh version n/a (n/a)",
    }),
  ],
});
