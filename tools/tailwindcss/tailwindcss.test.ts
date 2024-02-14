import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

toolTest({
  toolName: "tailwindcss",
  toolVersion: "3.3.5",
  testConfigs: [
    makeToolTestConfig({
      command: ["tailwindcss", "--help"],
      expectedOut: "tailwindcss v3.3.5",
    }),
  ],
  // On Windows, the shim is tailwindcss.cmd, and we don't support platform-specific shims yet.
  // To use on Windows, override the shim with tailwindcss.cmd.
  skipTestIf: skipOS(["win32"]),
});
