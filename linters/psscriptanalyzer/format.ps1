param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath
)

# Install PSScriptAnalyzer module, if needed
if ($null -eq (Get-InstalledModule -Name PSScriptAnalyzer -ErrorAction SilentlyContinue -WarningAction SilentlyContinue)) {
    Install-Module -Name PSScriptAnalyzer -Force
}

$ScriptDefinition = (Get-Content -Raw -Path $FilePath).Trim()

Invoke-Formatter -ScriptDefinition $ScriptDefinition -Settings PSScriptAnalyzerSettings.psd1 | Out-File -FilePath $FilePath
