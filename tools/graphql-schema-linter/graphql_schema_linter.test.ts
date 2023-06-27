import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "graphql-schema-linter",
  toolVersion: "3.0.1",
  testConfigs: [
    makeToolTestConfig({ command: ["graphql-schema-linter", "--version"], expectedOut: "3.0.1" }),
  ],
});
