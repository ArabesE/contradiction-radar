[CmdletBinding()]
param(
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $root 'data\runtime'
$pidFile = Join-Path $runtimeDir 'service.pid'
$stdout = Join-Path $runtimeDir 'service.out.log'
$stderr = Join-Path $runtimeDir 'service.err.log'
$entrypoint = Join-Path $root 'dist\src\index.js'
$envFile = Join-Path $root '.env.local'

function Test-ContradictionRadarProcess([int]$ProcessId) {
  $candidate = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
  if (-not $candidate) { return $false }
  $candidateExecutable = [System.IO.Path]::GetFullPath([string]$candidate.ExecutablePath)
  $expectedExecutable = [System.IO.Path]::GetFullPath([string]$node)
  return $candidateExecutable.Equals($expectedExecutable, [System.StringComparison]::OrdinalIgnoreCase) `
    -and ([string]$candidate.CommandLine).IndexOf($entrypoint, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
}

if (-not (Test-Path -LiteralPath $envFile)) {
  throw 'Missing .env.local. Copy .env.example and configure the Slack runtime credentials first.'
}

$node = Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1
if (-not $node) {
  $node = Join-Path $env:LOCALAPPDATA 'Programs\ContradictionRadarTools\node-v24.18.0-win-x64\node.exe'
}
if (-not (Test-Path -LiteralPath $node)) {
  throw 'Node.js 24 was not found. Install Node.js 24 or update scripts/start.ps1.'
}

if (Test-Path -LiteralPath $pidFile) {
  $existingPid = [int](Get-Content -LiteralPath $pidFile -ErrorAction SilentlyContinue)
  if (Test-ContradictionRadarProcess $existingPid) {
    Write-Output "Contradiction Radar is already running (PID $existingPid)."
    exit 0
  }
  Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

if (-not $SkipBuild -or -not (Test-Path -LiteralPath $entrypoint)) {
  $npm = Join-Path (Split-Path -Parent $node) 'npm.cmd'
  if (-not (Test-Path -LiteralPath $npm)) {
    $npm = Get-Command npm.cmd -ErrorAction Stop | Select-Object -ExpandProperty Source -First 1
  }
  Push-Location $root
  try {
    & $npm run build
    if ($LASTEXITCODE -ne 0) { throw 'TypeScript build failed.' }
  } finally {
    Pop-Location
  }
}

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
$process = Start-Process -FilePath $node `
  -ArgumentList @('--enable-source-maps', $entrypoint) `
  -WorkingDirectory $root `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdout `
  -RedirectStandardError $stderr `
  -PassThru

Set-Content -LiteralPath $pidFile -Value $process.Id
Start-Sleep -Seconds 2
if (-not (Get-Process -Id $process.Id -ErrorAction SilentlyContinue)) {
  throw "Contradiction Radar exited during startup. Review $stderr."
}

Write-Output "Contradiction Radar started (PID $($process.Id))."
