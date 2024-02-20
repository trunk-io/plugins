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
# NOTE: This could be converted to a tool once there is a way to pass in root directories of tools other than the linter itself
$Version = "1.0.0"
$ImportPath = Join-Path "TEMP:" "ConvertToSARIF" $Version
Save-Module -Name ConvertToSARIF -Path "TEMP:" -RequiredVersion $Version
Import-Module -Name (Join-Path $ImportPath "ConvertToSARIF.psd1")

$AnalyzerSplat = @{
    Path = $FilePath
    Fix  = $true
}

if (Test-Path "PSScriptAnalyzerSettings.psd1") {
    $AnalyzerSplat += @{
        Settings = "PSScriptAnalyzerSettings.psd1"
    }
}

Invoke-ScriptAnalyzer @AnalyzerSplat | ConvertTo-SARIF -FilePath $OutputPath

Remove-Item -Path (Join-Path "TEMP:" "ConvertToSARIF") -Force
