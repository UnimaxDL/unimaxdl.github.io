# UnimaxDL Native Windows Installer (PowerShell)
# Official Source: https://unimaxdl.github.io/install.ps1

$ErrorActionPreference = 'Stop'

$InstallerName = 'UnimaxDL-Setup-v1.0.0.exe'
$ExpectedSha   = '3fa4e7812400b0108e2938916b1493a556d57193f134f5a2502126c0a1123e60'
$DownloadUrl   = "https://unimaxdl.github.io/downloads/$InstallerName"
$TempTarget    = Join-Path $env:TEMP $InstallerName

Write-Host "Downloading $InstallerName..." -ForegroundColor Cyan
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $DownloadUrl -OutFile $TempTarget -UseBasicParsing

$ActualSha = (Get-FileHash -Path $TempTarget -Algorithm SHA256).Hash.ToLowerInvariant()
if ($ActualSha -ne $ExpectedSha) {
  Remove-Item -Path $TempTarget -Force -ErrorAction SilentlyContinue
  throw "SHA-256 verification failed. Expected $ExpectedSha but got $ActualSha."
}

Write-Host "Verified SHA-256: $ActualSha" -ForegroundColor Green
Write-Host "Launching UnimaxDL Setup..." -ForegroundColor Cyan
Start-Process -FilePath $TempTarget
