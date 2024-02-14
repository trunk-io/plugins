import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

toolTest({
  toolName: "gulp",
  toolVersion: "4.0.2",
  testConfigs: [
    makeToolTestConfig({
      command: ["gulp", "--version"],
      expectedOut: "Local version: 4.0.2",
    }),
  ],
  // On Windows, the shim is gulp.cmd, and we don't support platform-specific shims yet.
  // To use on Windows, override the shim with gulp.cmd.
  skipTestIf: skipOS(["win32"]),
});
