param(
    [Parameter(Mandatory = $true)]
    [string]$ModuleDir,
    [Parameter(Mandatory = $true)]
    [string]$FilePath
)

# Import PSScriptAnalyzer module
Import-Module -Name (Join-Path $ModuleDir "PSScriptAnalyzer.psd1")

$ScriptDefinition = (Get-Content -Raw -Path $FilePath).Trim()

Invoke-Formatter -ScriptDefinition $ScriptDefinition -Settings PSScriptAnalyzerSettings.psd1 | Out-File -FilePath $FilePath
