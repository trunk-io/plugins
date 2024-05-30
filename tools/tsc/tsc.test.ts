import { toolInstallTest } from "tests";
import { skipOS } from "tests/utils";

// TODO(Tyler): tool def is missing healthcheck
toolInstallTest({
  toolName: "tsc",
  toolVersion: "5.2.2",
  // On Windows, the shim is tsc.cmd, and we don't support platform-specific shims yet.
  // To use on Windows, override the shim with tsc.cmd.
  skipTestIf: skipOS(["win32"]),
});
