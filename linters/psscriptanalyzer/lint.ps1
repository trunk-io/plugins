param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

# Import PSScriptAnalyzer module
Import-Module -Name (Get-Command -Name "PSScriptAnalyzer.psd1").Source

# Import ConvertToSARIF module
$CtsPath = (Get-Command -Name "ConvertToSARIF.psd1").Source
Import-Module -Name $CtsPath

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
