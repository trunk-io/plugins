import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

toolTest({
  toolName: "webpack",
  toolVersion: "5.89.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["webpack", "--version"],
      expectedOut: "Binaries:",
    }),
  ],
  // On Windows, the shim is webpack.cmd, and we don't support platform-specific shims yet.
  // To use on Windows, override the shim with webpack.cmd.
  skipTestIf: skipOS(["win32"]),
});
