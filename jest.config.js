module.exports = {
  transform: { "^.+\\.ts?$": "ts-jest" },
  testEnvironment: "node",
  testRegex: "/tests/.*\\.(ts)$",
  moduleFileExtensions: ["ts", "js", "json", "node"],
};
