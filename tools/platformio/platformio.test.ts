import { makeToolTestConfig, toolInstallTest, toolTest } from "tests";
toolTest({
  toolName: "platformio",
  toolVersion: "6.1.11",
  testConfigs: [
    makeToolTestConfig({
      command: ["pio", "--version"],
      expectedOut: "PlatformIO Core, version 6.1.11",
    }),
  ],
});

toolInstallTest({
  toolName: "platformio",
  toolVersion: "6.1.11",
});
