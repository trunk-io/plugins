module.exports = {
  transform: { "^.+\\.ts?$": "ts-jest" },
  testEnvironment: "node",
  testMatch: ["/tests/index.ts", "/**/*test.ts"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  verbose: false,
};
