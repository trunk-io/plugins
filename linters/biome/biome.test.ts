import { linterCheckTest, linterFmtTest, TestCallback } from "tests";

linterCheckTest({ linterName: "biome", namedTestPrefixes: ["basic_check"] });

linterFmtTest({ linterName: "biome", namedTestPrefixes: ["basic_fmt", "basic_json"] });

// Verify warning-level findings ('!' marker) are captured by parse_regex,
// not just errors ('×'). Regression coverage for trunk-io/plugins#1113.
const enableWarnRule: TestCallback = (driver) => {
  driver.writeFile(
    "biome.json",
    JSON.stringify({
      $schema: "https://biomejs.dev/schemas/2.3.4/schema.json",
      linter: {
        enabled: true,
        rules: {
          recommended: false,
          style: { noNonNullAssertion: "warn" },
        },
      },
    }),
  );
};
linterCheckTest({
  linterName: "biome",
  namedTestPrefixes: ["warning_check"],
  preCheck: enableWarnRule,
});
