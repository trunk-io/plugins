import { toolInstallTest } from "tests";

// The binary name varies by platform so we can't roll this into a health_check as-is.
toolInstallTest({
  toolName: "yq",
  toolVersion: "4.44.1",
});
