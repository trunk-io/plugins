import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "minikube",
  toolVersion: "1.24.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["minikube", "version"],
      expectedOut: "minikube version: v1.24.0",
    }),
  ],
});
