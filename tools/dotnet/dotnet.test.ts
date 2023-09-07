import { makeToolTestConfig, toolTest } from "tests";
toolTest({
  toolName: "dotnet",
  toolVersion: "7.0.400",
  testConfigs: [
    makeToolTestConfig({
      command: ["dotnet", "--version"],
      expectedOut: "7.0.400",
    }),
  ],
});
