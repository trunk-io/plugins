import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "tailwindcss",
  toolVersion: "3.3.5",
  testConfigs: [
    makeToolTestConfig({
      command: ["tailwindcss", "--help"],
      expectedOut: "tailwindcss v3.3.5",
    }),
  ],
});
