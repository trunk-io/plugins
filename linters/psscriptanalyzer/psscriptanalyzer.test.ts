import path from "path";
import { customLinterCheckTest, linterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

// Run with `-y` since on Windows Invoke-Formatter will add carriage returns, and for testing's sake it's easier to just apply.
const checkArgs = `${path.join(TEST_DATA, "check.in.ps1")} -y`;

// Run tests with default rules
linterFmtTest({
  linterName: "psscriptanalyzer",
  namedTestPrefixes: ["format"],
});
customLinterCheckTest({
  linterName: "psscriptanalyzer",
  testName: "check",
  args: checkArgs,
});

// Create a PSScriptAnalyzerSettings.psd1 for further testing
const preCheck = (driver: TrunkLintDriver) => {
  driver.writeFile(
    ".trunk/configs/PSScriptAnalyzerSettings.psd1",
    `@{
ExcludeRules = @("PSAvoidUsingWriteHost","AvoidTrailingWhitespace")
Rules = @{PSAvoidSemicolonsAsLineTerminators = @{Enable = $true}}
}`,
  );
};

// Run tests with custom settings
linterFmtTest({
  linterName: "psscriptanalyzer",
  namedTestPrefixes: ["format"],
  preCheck,
});
customLinterCheckTest({
  linterName: "psscriptanalyzer",
  testName: "check_custom_settings",
  args: checkArgs,
  preCheck,
});
