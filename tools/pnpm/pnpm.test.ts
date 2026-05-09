import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "pnpm",
  toolVersion: "11.0.9",
  testConfigs: [makeToolTestConfig({ command: ["pnpm", "--version"], expectedOut: "11.0.9" })],
});

toolTest({
  toolName: "pnpm",
  toolVersion: "8.6.1",
  testConfigs: [makeToolTestConfig({ command: ["pnpm", "--version"], expectedOut: "8.6.1" })],
});
