import { linterCheckTest, linterFmtTest } from "tests";

// Guidelines for configuring tests:
//  - By default, linters and formatters will only run on files with syntax `<name>.in.<extension>`
//  - You can customize test setup using the `preCheck` callback (see git_diff_check.test.ts and golangci_lint.test.ts)
//  - You can specify additional customization using the `customLinterCheckTest` and `customLinterFmtTest` helpers
//  - Additional information on test setup can be found in tests/README.md
//
// If you are unable to write a test for this linter, please document why in your PR. Feel free to ask for help!

// Use if your tool is a linter
linterCheckTest({ linterName: "NAME_HERE" });

// Use if your tool is a formatter
linterFmtTest({ linterName: "NAME_HERE" });
