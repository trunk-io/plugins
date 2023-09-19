import { makeToolTestConfig, toolTest } from "tests";
toolTest({
  toolName: "clangd",
  toolVersion: "16.0.2",
  testConfigs: [
    makeToolTestConfig({
      command: ["clangd", "--version"],
      expectedOut: "clangd version 16.0.2",
    }),
  ],
});
