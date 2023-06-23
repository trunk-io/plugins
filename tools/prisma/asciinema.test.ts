import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "prisma",
  toolVersion: "4.16.1",
  testConfigs: [
    makeToolTestConfig({
      command: ["prisma", "--version"],
      expectedOut: "4.16.1",
    }),
  ],
});
