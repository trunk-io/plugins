import { toolTest } from "tests";

toolTest({
  toolName: "minikube", // toolName
  toolVersion: "1.24.0", // version
  testConfigs: [
    {
      command: ["minikube", "version"],
      expectedExitCode: 0,
      expectedOut: "minikube version: v1.24.0",
      expectedErr: "",
    },
  ],
});
