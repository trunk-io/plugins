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

// Verify .gitignore reaches the sandbox so vcs.useIgnoreFile works. Without
// the symlinks: directive in plugin.yaml, biome aborts with internalError/fs
// when it can't find the ignore file and silently drops all findings.
// Regression coverage for trunk-io/plugins#1113 issue 2.
const setupGitignoreRepo: TestCallback = (driver) => {
  driver.writeFile(
    "biome.json",
    JSON.stringify({
      $schema: "https://biomejs.dev/schemas/2.3.4/schema.json",
      vcs: { clientKind: "git", enabled: true, useIgnoreFile: true },
      linter: { enabled: true, rules: { recommended: true } },
    }),
  );
  driver.writeFile(".gitignore", "");
};
linterCheckTest({
  linterName: "biome",
  namedTestPrefixes: ["gitignore_check"],
  preCheck: setupGitignoreRepo,
});
