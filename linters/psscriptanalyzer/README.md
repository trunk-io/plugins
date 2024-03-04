# PSScriptAnalyzer

This linter provides support for linting and formatting PowerShell via
[PSScriptAnalyzer](https://github.com/PowerShell/PSScriptAnalyzer).

## Configuration

By default, this linter will use the
[default set of included rules](https://learn.microsoft.com/en-us/powershell/utility-modules/psscriptanalyzer/rules/readme?view=ps-modules),
but you can supply your own configuration by creating a `PSScriptAnalyzerSettings.psd1` either in
the project root or in `.trunk/configs`.

Here is a sample configuration that will disable several built-in rules while enabling optional
rules for enforcing line terminators, the One True Brace Style, indentation, and casing:

```PowerShell
@{
    ExcludeRules = @(
        "PSAvoidUsingWriteHost",
        "PSUseBOMForUnicodeEncodedFile"
    )
    Rules = @{
        PSAvoidSemicolonsAsLineTerminators = @{
            Enable = $true
        }
        PSPlaceOpenBrace = @{
            Enable = $true
            OnSameLine = $true
            NewLineAfter = $true
            IgnoreOneLineBlock = $true
        }
        PSPlaceCloseBrace = @{
            Enable = $true
            NoEmptyLineBefore = $true
            IgnoreOneLineBlock = $true
            NewLineAfter = $false
        }
        PSUseConsistentIndentation = @{
            Enable = $true
        }
        PSUseCorrectCasing = @{
            Enable = $true
        }
    }
}
```
