import { makeToolTestConfig, toolTest } from "tests";
import { osTimeoutMultiplier } from "tests/utils";

// This install is quite slow on some Linux machines.
jest.setTimeout(600000 * osTimeoutMultiplier);

toolTest({
  toolName: "goreleaser",
  toolVersion: "1.25.1",
  testConfigs: [
    makeToolTestConfig({ command: ["goreleaser", "--version"], expectedOut: "goreleaser" }),
  ],
});
