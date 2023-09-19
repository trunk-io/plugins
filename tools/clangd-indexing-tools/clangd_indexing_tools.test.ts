import { makeToolTestConfig, toolTest } from "tests";
toolTest({
  toolName: "clangd-indexing-tools",
  toolVersion: "16.0.2",
  testConfigs: [
    makeToolTestConfig({
      command: ["clangd-indexer", "--version"],
      expectedOut: "LLVM version 16.0.2",
    }),
    makeToolTestConfig({
      command: ["clangd-index-server", "--version"],
      expectedOut: "LLVM version 16.0.2",
    }),
    makeToolTestConfig({
      command: ["clangd-index-server-monitor", "--version"],
      expectedOut: "LLVM version 16.0.2",
    }),
  ],
});
