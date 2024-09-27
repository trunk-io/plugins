import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "kubectl",
  toolVersion: "1.25.16",
  testConfigs: [
    makeToolTestConfig({
      // --short flag will be removed in future versions
      command: ["kubectl", "version", "--short"],
      expectedOut: "Client Version: v1.25.16",
      // This fails on no kubectl credentials. Why do you need that for a version check? Who knows...
      expectedExitCode: 1,
    }),
  ],
  // kubectl does not run on Windows. But kubectl is frequently flaky in CI because it spins up a kubectl daemon.
  skipTestIf: () => true,
});
