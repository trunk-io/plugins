import { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  verbose: false,

  testMatch: ["/**/*test.ts"],
  moduleFileExtensions: ["ts", "js"],
  modulePaths: ["<rootDir>"],
  setupFilesAfterEnv: ["./setup.ts"],
};

export default config;
