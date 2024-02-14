import { makeToolTestConfig, toolTest } from "tests";
import { osTimeoutMultiplier, skipOS } from "tests/utils";

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
  // On Windows, the shim is renovate.cmd, and we don't support platform-specific shims yet.
  // To use on Windows, override the shim with renovate.cmd.
  skipTestIf: skipOS(["win32"]),
});
