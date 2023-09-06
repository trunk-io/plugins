import { makeToolTestConfig, toolTest } from "tests";
import { skipCPUOS } from "tests/utils";

const skipTestIfLambda = (version?: string | undefined) =>
  skipCPUOS([{ os: "darwin", cpu: "arm64" }])(version) ||
  skipCPUOS([{ os: "linux", cpu: "arm64" }])(version);

toolTest({
  toolName: "jq",
  toolVersion: "1.6",
  testConfigs: [makeToolTestConfig({ command: ["jq", "--version"], expectedOut: "jq-1.6" })],
  skipTestIf: skipTestIfLambda,
});

toolTest({
  toolName: "jq",
  toolVersion: "1.5",
  testConfigs: [makeToolTestConfig({ command: ["jq", "--version"], expectedOut: "jq-1.5" })],
  skipTestIf: skipTestIfLambda,
});
