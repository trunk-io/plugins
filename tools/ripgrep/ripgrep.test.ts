import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";
toolTest({
  toolName: "ripgrep",
  toolVersion: "13.0.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["rg", "--version"],
      expectedOut: "ripgrep 13.0.0",
    }),
  ],
  // Requires installation of VS "C++ build tools", which we don't yet have set up
  skipTestIf: skipOS(["win32"]),
});
