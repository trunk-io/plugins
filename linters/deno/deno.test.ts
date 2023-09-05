import { linterCheckTest, linterFmtTest } from "tests";
// Uncomment and use if your tool is a linter
// linterCheckTest({ linterName: "deno" });

// Uncomment and use if your tool is a formatter
linterFmtTest({ linterName: "deno" });

// Guidelines for configuring tests:
//  - By default, linters and formatters will only run on files with syntax `<name>.in.<extension>`
//  - You can customize test setup using the `preCheck` callback (see git_diff_check.test.ts and golangci_lint.test.ts)
//  - You can specify additional customization using the `customLinterCheckTest and customLinterFmtTest` helpers
//  - Additional information on test setup can be found in tests/readme.md
