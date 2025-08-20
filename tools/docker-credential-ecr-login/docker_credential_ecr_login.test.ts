import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "docker-credential-ecr-login",
  toolVersion: "0.8.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["docker-credential-ecr-login", "-v"],
      expectedOut: "Version:    0.8.0",
    }),
  ],
});
