import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "assh",
  toolVersion: "2.10.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["assh", "--version"],
      expectedOut: "assh version n/a (n/a)",
    }),
  ],
});
