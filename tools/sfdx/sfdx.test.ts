import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

toolTest({
  toolName: "sfdx",
  toolVersion: "2.0.1",
  testConfigs: [
    makeToolTestConfig({
      command: ["sfdx", "--version"],
      expectedOut: "2.0.1",
    }),
    makeToolTestConfig({
      command: ["sf", "--version"],
      expectedOut: "2.0.1",
    }),
  ],
  // On Windows, the shim is sf/sfdx.cmd, and we don't support platform-specific shims yet.
  // To use on Windows, override the shim with sf/sfdx.cmd.
  skipTestIf: skipOS(["win32"]),
});
