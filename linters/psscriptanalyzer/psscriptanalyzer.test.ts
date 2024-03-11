import path from "path";
import { customLinterCheckTest, linterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

// Run with `-y` since on Windows Invoke-Formatter will add carriage returns, and for testing's sake it's easier to just apply.
const checkArgs = `${path.join(TEST_DATA, "check.in.ps1")} -y`;

const manualVersionReplacer = (version: string) => {
  if (version === "1.22.0") {
    // As of 3/11, 1.22.0 doesn't have a release asset.
    return "1.21.0";
  }
  return version;
};

// Run tests with default rules
linterFmtTest({
  linterName: "psscriptanalyzer",
  namedTestPrefixes: ["format"],
  manualVersionReplacer,
});
customLinterCheckTest({
  linterName: "psscriptanalyzer",
  testName: "check",
  args: checkArgs,
  manualVersionReplacer,
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
  manualVersionReplacer,
});
customLinterCheckTest({
  linterName: "psscriptanalyzer",
  testName: "check_custom_settings",
  args: checkArgs,
  preCheck,
  manualVersionReplacer,
});
