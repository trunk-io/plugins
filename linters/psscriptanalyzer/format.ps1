param(
    [Parameter(Mandatory = $true)]
    [string]$ModuleDir,
    [Parameter(Mandatory = $true)]
    [string]$FilePath
)

# Import PSScriptAnalyzer module
Import-Module -Name (Join-Path $ModuleDir "PSScriptAnalyzer.psd1")

$ScriptDefinition = (Get-Content -Raw -Path $FilePath).Trim()

$FormatterSplat = @{
    ScriptDefinition = $ScriptDefinition
}

if (Test-Path "PSScriptAnalyzerSettings.psd1") {
    $FormatterSplat += @{
        Settings = "PSScriptAnalyzerSettings.psd1"
    }
}

Invoke-Formatter @FormatterSplat | Out-File -FilePath $FilePath
