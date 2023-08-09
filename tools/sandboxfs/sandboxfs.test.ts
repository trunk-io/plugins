import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "sandboxfs",
  toolVersion: "0.2.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["sandboxfs", "--version"],
      expectedOut: "sandboxfs 0.2.0",
    }),
  ],
});
