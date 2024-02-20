param(
  [Parameter(Mandatory = $true)]
  [string]$ModuleDir,
  [Parameter(Mandatory = $true)]
  [string]$FilePath,
  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

# Import PSScriptAnalyzer module
Import-Module -Name (Join-Path $ModuleDir PSScriptAnalyzer.psd1)

# Download and import ConvertToSARIF module
$Version = "1.0.0"
$ImportPath = Join-Path "TEMP:" "ConvertToSARIF" $Version
Save-Module -Name ConvertToSARIF -Path "TEMP:" -RequiredVersion $Version
Import-Module -Name (Join-Path $ImportPath "ConvertToSARIF.psd1")

Invoke-ScriptAnalyzer -Path $FilePath -Settings PSScriptAnalyzerSettings.psd1 -Fix | ConvertTo-SARIF -FilePath $OutputPath

Remove-Item -Path (Join-Path "TEMP:" "ConvertToSARIF") -Force
