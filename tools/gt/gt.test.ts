import { makeToolTestConfig, toolTest } from "tests";
import { skipCPUOS, skipOS } from "tests/utils";

toolTest({
  toolName: "gt",
  toolVersion: "0.20.19",
  testConfigs: [makeToolTestConfig({ command: ["gt", "--version"], expectedOut: "0.20.19" })],
  skipTestIf: (version) => {
    if (process.env.CI) {
      console.log("Skipping gt test for CI until we have better parsing logic.");
      return true;
    }

    // Unsupported download
    return skipCPUOS([{ os: "linux", cpu: "arm64" }])(version);
  },
});

toolTest({
  toolName: "gt",
  toolVersion: "1.0.7",
  testConfigs: [makeToolTestConfig({ command: ["gt", "--version"], expectedOut: "1.0.7" })],
  skipTestIf: skipOS(["win32"]),
});
