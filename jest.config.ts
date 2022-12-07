import { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  verbose: false,

  testMatch: ["/tests/index.ts", "/**/*test.ts"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  modulePaths: ["<rootDir>"],
  setupFilesAfterEnv: ["./setup.ts"],
};

export default config;
