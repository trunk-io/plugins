import { makeToolTestConfig, toolTest } from "tests";
import { skipOS } from "tests/utils";

toolTest({
  toolName: "prisma",
  toolVersion: "4.16.1",
  testConfigs: [
    makeToolTestConfig({
      command: ["prisma", "--version"],
      expectedOut: "4.16.1",
    }),
  ],
  // prisma.bat doesn't exit and close handles on Windows
  skipTestIf: skipOS(["win32"]),
});
