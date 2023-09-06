import { makeToolTestConfig, toolTest } from "tests";
import { skipCPUOS } from "tests/utils";

toolTest({
  toolName: "deno",
  toolVersion: "1.36.4",
  testConfigs: [makeToolTestConfig({ command: ["deno", "--version"], expectedOut: "deno 1.36.4" })],
  skipTestIf: skipCPUOS([{ os: "linux", cpu: "arm64" }]),
});
