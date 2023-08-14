import { makeToolTestConfig, toolTest } from "tests";
toolTest({
  toolName: "tfnotify",
  toolVersion: "0.8.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["tfnotify", "--version"],
      expectedOut: "tfnotify version unset",
    }),
  ],
});
