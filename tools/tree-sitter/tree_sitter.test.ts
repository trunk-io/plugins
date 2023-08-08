import { makeToolTestConfig, toolTest } from "tests";
toolTest({
  toolName: "tree-sitter",
  toolVersion: "0.20.8",
  testConfigs: [
    makeToolTestConfig({
      command: ["tree-sitter", "--version"],
      expectedOut: "tree-sitter 0.20.8",
    }),
  ],
});
