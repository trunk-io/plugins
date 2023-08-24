import { makeToolTestConfig, toolTest } from "tests";
import { osTimeoutMultiplier } from "tests/utils";

jest.setTimeout(600000 * osTimeoutMultiplier); // 300s or 900s

toolTest({
  toolName: "renovate",
  toolVersion: "34.122.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["renovate", "--version"],
      expectedOut: "34.122.0",
    }),
  ],
});
