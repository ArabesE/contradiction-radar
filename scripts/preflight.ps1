[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
  npm run check
  if ($LASTEXITCODE -ne 0) { throw 'npm run check failed.' }
  npm run evaluate
  if ($LASTEXITCODE -ne 0) { throw 'npm run evaluate failed.' }
  npm run health
  if ($LASTEXITCODE -ne 0) { throw 'npm run health failed.' }
  npm audit --omit=dev --audit-level=high
  if ($LASTEXITCODE -ne 0) { throw 'Production dependency audit failed.' }
  npm run audit:licenses
  if ($LASTEXITCODE -ne 0) { throw 'License audit failed.' }
  $gitleaks = Get-Command gitleaks.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1
  if (-not $gitleaks) {
    $gitleaks = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter gitleaks.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName -First 1
  }
  if (-not $gitleaks) { throw 'Gitleaks is required for preflight. Install Gitleaks.Gitleaks with winget.' }
  $scanRoot = Join-Path ([System.IO.Path]::GetTempPath()) "contradiction-radar-gitleaks-$PID-$([guid]::NewGuid().ToString('N'))"
  New-Item -ItemType Directory -Force -Path $scanRoot | Out-Null
  try {
    $reviewFiles = & git ls-files --cached --others --exclude-standard
    if ($LASTEXITCODE -ne 0) { throw 'Unable to enumerate reviewable repository files.' }
    foreach ($relative in $reviewFiles) {
      $source = Join-Path $root $relative
      if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { continue }
      $destination = Join-Path $scanRoot $relative
      New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destination) | Out-Null
      Copy-Item -LiteralPath $source -Destination $destination
    }
    & $gitleaks dir $scanRoot --no-banner --redact
    if ($LASTEXITCODE -ne 0) { throw 'Reviewable working-tree secret scan failed.' }
  } finally {
    $resolvedScanRoot = [System.IO.Path]::GetFullPath($scanRoot)
    $resolvedTempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
    if ($resolvedScanRoot.StartsWith($resolvedTempRoot, [System.StringComparison]::OrdinalIgnoreCase) -and (Split-Path -Leaf $resolvedScanRoot).StartsWith('contradiction-radar-gitleaks-')) {
      Remove-Item -LiteralPath $resolvedScanRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
  }
  & $gitleaks git . --no-banner --redact
  if ($LASTEXITCODE -ne 0) { throw 'Git-history secret scan failed.' }
  Write-Output 'Preflight complete.'
} finally {
  Pop-Location
}
