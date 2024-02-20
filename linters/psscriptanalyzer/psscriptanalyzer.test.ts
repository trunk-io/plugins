import { linterCheckTest, linterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";

// Run tests with default rules
linterFmtTest({ linterName: "psscriptanalyzer", namedTestPrefixes: ["format"] });
linterCheckTest({ linterName: "psscriptanalyzer", namedTestPrefixes: ["check"] });

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
  namedTestPrefixes: ["format_custom_settings"],
  preCheck,
});
linterCheckTest({
  linterName: "psscriptanalyzer",
  namedTestPrefixes: ["check_custom_settings"],
  preCheck,
});
