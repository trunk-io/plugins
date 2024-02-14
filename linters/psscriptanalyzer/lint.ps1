param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

# Install PSScriptAnalyzer module, if needed
if ($null -eq (Get-InstalledModule -Name PSScriptAnalyzer -ErrorAction SilentlyContinue -WarningAction SilentlyContinue)) {
    Install-Module -Name PSScriptAnalyzer -Force
}

# Install ConvertToSARIF module, if needed
if ($null -eq (Get-InstalledModule -Name ConvertToSARIF -ErrorAction SilentlyContinue -WarningAction SilentlyContinue)) {
    Install-Module -Name ConvertToSARIF -Force
}
Import-Module -Name ConvertToSARIF -Force

Invoke-ScriptAnalyzer -Path $FilePath -Settings PSScriptAnalyzerSettings.psd1 -Fix | ConvertTo-SARIF -FilePath $OutputPath
