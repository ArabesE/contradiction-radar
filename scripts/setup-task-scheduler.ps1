[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$startScript = Join-Path $PSScriptRoot 'start.ps1'
$taskName = 'Contradiction Radar'
$pwsh = Get-Command pwsh.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1
if (-not $pwsh) {
  $pwsh = Get-Command powershell.exe -ErrorAction Stop | Select-Object -ExpandProperty Source -First 1
}

$arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$startScript`" -SkipBuild"
$action = New-ScheduledTaskAction -Execute $pwsh -Argument $arguments -WorkingDirectory $root
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Days 3) -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description 'Starts the local Contradiction Radar Slack Socket Mode agent at logon.' -Force | Out-Null
Write-Output "Scheduled task '$taskName' is installed for $env:USERNAME."
