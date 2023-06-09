import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "pnpm",
  toolVersion: "v8.6.1",
  testConfigs: [makeToolTestConfig({ command: ["pnpm", "--version"], expectedOut: "8.6.1" })],
});
