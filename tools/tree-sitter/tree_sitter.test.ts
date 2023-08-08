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

// Guidelines for configuring tests:
//  - Usually, just a version or help text command is sufficient
//  - add a test for each command that is used in the plugin.yaml
//  - exit code 0 is assumed, so set expectedExitCode if it is different
//  - expectedOut/expectedErr do a substring match, so you can just put a portion of the output
//
// If you are unable to write a test for this tool, please document why in your PR, and add
// it to the list in tests/repo_tests/test_coverage_test.ts
