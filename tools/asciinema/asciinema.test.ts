import { toolTest } from "tests";

toolTest({
  toolName: "asciinema", // toolName
  toolVersion: "2.1.0", // version
  testConfigs: [
    {
      command: ["asciinema", "--version"],
      expectedExitCode: 0,
      expectedOut: "asciinema 2.1.0",
      expectedErr: "",
    },
  ],
});
