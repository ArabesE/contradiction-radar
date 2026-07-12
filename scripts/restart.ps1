[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $root 'data\runtime\service.pid'
$entrypoint = Join-Path $root 'dist\src\index.js'
$node = Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1
if (-not $node) {
  $node = Join-Path $env:LOCALAPPDATA 'Programs\ContradictionRadarTools\node-v24.18.0-win-x64\node.exe'
}

function Test-ContradictionRadarProcess([int]$ProcessId) {
  $candidate = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
  if (-not $candidate) { return $false }
  $candidateExecutable = [System.IO.Path]::GetFullPath([string]$candidate.ExecutablePath)
  $expectedExecutable = [System.IO.Path]::GetFullPath([string]$node)
  return $candidateExecutable.Equals($expectedExecutable, [System.StringComparison]::OrdinalIgnoreCase) `
    -and ([string]$candidate.CommandLine).IndexOf($entrypoint, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
}

if (Test-Path -LiteralPath $pidFile) {
  $existingPid = [int](Get-Content -LiteralPath $pidFile -ErrorAction SilentlyContinue)
  if (Test-ContradictionRadarProcess $existingPid) {
    $process = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
    Stop-Process -Id $existingPid -Force
    $process.WaitForExit(5000)
  }
  Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

& (Join-Path $PSScriptRoot 'start.ps1')
