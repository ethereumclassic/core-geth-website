# The guide workflows' runner for Windows PowerShell 5.1, the PowerShell a Windows 11 reader opens. Each block
# runs in a powershell.exe of its own that starts in the folder, and with the variables and the PATH, that the
# blocks before it left, so the blocks run as they do one after another in a window. A block stops at its
# first failing line, which is stricter than a paste; a block whose lines continue one another runs whole.
#
# A node start runs in a window of its own, as a reader's does, and stops the way a reader stops it: Ctrl+C in
# that window, which ctrl-c.ps1 sends before it saves the window's text for the clean-stop check.
#
# A scenario names each block by its path in the bundle tests/guides/blocks.py writes, so a step renamed on the
# page fails the run. With $env:DRY set nothing runs: each function only checks that its block is on the page.

$ErrorActionPreference = 'Stop'
if (-not $env:BUNDLE) { throw 'set BUNDLE to the directory tests/guides/blocks.py wrote' }
$Dry = [bool]$env:DRY
$Work = Join-Path ([IO.Path]::GetTempPath()) ('guides-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $Work | Out-Null
$StateFile = Join-Path $Work 'state.xml'
$Lib = $PSScriptRoot
$script:NodeHost = $null

# What each block's powershell.exe runs before the block: the state the blocks before it left.
$Prelude = @'
$ErrorActionPreference = 'Continue'
$MaximumErrorCount = 32768
$__auto = @(Get-Variable | ForEach-Object Name)
$__state = Import-Clixml -LiteralPath '{state}'
Set-Location -LiteralPath $__state.Location
$env:Path = $__state.Path
foreach ($__k in $__state.Vars.Keys) { Set-Variable -Name $__k -Value $__state.Vars[$__k] }
'@

# After each line: a native command that failed, or an error other than a native command's own output on
# stderr, which Windows PowerShell records as an error whenever that output is redirected.
$LineStart = '$global:LASTEXITCODE = 0; $Error.Clear()'
$LineCheck = @'
if ($LASTEXITCODE) { Write-Host "FAILED: {where} exited with code $LASTEXITCODE"; exit 1 }
$__errors = @($Error | Where-Object { $_.FullyQualifiedErrorId -notlike 'NativeCommandError*' })
if ($__errors.Count) { Write-Host "FAILED: {where}: $($__errors[-1])"; exit 1 }
'@

# What the block leaves for the next one: its folder, its PATH and the variables it set.
$Epilogue = @'
$__vars = @{}
$__skip = @('LASTEXITCODE', 'Matches', 'StackTrace', 'foreach', 'PSItem', '_', 'args', 'input', 'this')
foreach ($__v in Get-Variable) {
  if ($__auto -notcontains $__v.Name -and $__v.Name -notlike '__*' -and $__skip -notcontains $__v.Name) {
    $__vars[$__v.Name] = $__v.Value
  }
}
@{ Location = (Get-Location).Path; Path = $env:Path; Vars = $__vars } | Export-Clixml -LiteralPath '{state}'
exit 0
'@

function Save-State([string]$Location, [string]$PathValue, [hashtable]$Vars) {
  @{ Location = $Location; Path = $PathValue; Vars = $Vars } | Export-Clixml -LiteralPath $StateFile
}

function Say([string]$Text) {
  Write-Host ''
  Write-Host "== $Text"
}

# A new PowerShell window: the home folder, the PATH Windows gives a new window, and no variables.
function New-Window {
  $fresh = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
  Save-State $HOME $fresh @{}
  Write-Host "  (a new window, in $HOME)"
}

# The reader's `cd`, where a step's text says which folder to be in.
function Set-Here([string]$Folder) {
  $s = Import-Clixml -LiteralPath $StateFile
  Save-State $Folder $s.Path $s.Vars
  Write-Host "  (in $Folder, as the step says)"
}

function Get-BlockFile([string]$Path) {
  if ([IO.Path]::IsPathRooted($Path)) { $file = $Path } else { $file = Join-Path $env:BUNDLE $Path }
  if (-not (Test-Path -LiteralPath $file)) {
    Write-Host "MISSING BLOCK: $Path is not on the built page"
    exit 2
  }
  return $file
}

function Show-Block([string]$Path) {
  $file = Get-BlockFile $Path
  Write-Host "--- $($Path.Replace("$Work\", ''))"
  if (Test-Path -LiteralPath "$file.why") { Write-Host "    ($([IO.File]::ReadAllText("$file.why")))" }
  foreach ($line in Get-Content -LiteralPath $file -Encoding UTF8) { Write-Host "  | $line" }
  return $file
}

# A copy of a block changed the way its note asks, which the functions here run in its place.
function New-Copy([string]$Path, [string]$Why, [scriptblock]$Change) {
  $file = Get-BlockFile $Path
  $copy = Join-Path $Work ($Path.Replace("$Work\", '') + '.edited')
  New-Item -ItemType Directory -Force -Path (Split-Path $copy) | Out-Null
  [IO.File]::WriteAllText($copy, (& $Change ([IO.File]::ReadAllText($file))))
  [IO.File]::WriteAllText("$copy.why", $Why)
  return $copy
}

# A copy of a block with flags added to its last line, as a note asks.
function Add-Flags([string]$Path, [string]$Flags) {
  return New-Copy $Path "with $Flags added, as its note asks" { param($text) $text.TrimEnd() + " $Flags`n" }
}

# The enode ID in a block's output, without its address.
function Get-EnodeId([string]$Text) {
  $m = [regex]::Match($Text, 'enode://[0-9a-f]{128}')
  return $m.Value
}

function Assert-Differ([string]$What, [string]$Before, [string]$After) {
  if ($Dry) { return }
  if (-not $Before -or $Before -eq $After) {
    Write-Host "FAILED: $What did not change ($Before)"
    exit 1
  }
  Write-Host "  $What changed: $Before -> $After"
}

function Assert-Holds([string]$What, [string]$Text, [string]$Pattern) {
  if ($Dry) { return }
  if ($Text -notmatch $Pattern) {
    Write-Host "FAILED: $What did not match /$Pattern/"
    exit 1
  }
  Write-Host "  $What matches /$Pattern/"
}

# A check of CI's own that a file is there, or is not.
function Assert-Path([string]$Path, [switch]$Missing) {
  if ($Dry) { return }
  $there = Test-Path -LiteralPath $Path
  if ($there -eq [bool]$Missing) {
    Write-Host "FAILED: $Path is $(if ($there) { 'still there' } else { 'not there' })"
    exit 1
  }
  Write-Host "  ci: $Path is $(if ($there) { 'there' } else { 'gone' })"
}

function Skip-Block([string]$Path, [string]$Why) {
  $null = Show-Block $Path
  Write-Host "SKIPPED: $Why"
}

# Lines that continue one another: a block holding one is run whole, with one check at its end.
function Test-Whole([string[]]$Lines) {
  foreach ($line in $Lines) {
    $t = $line.TrimEnd()
    if ($t -match '[`|,{(\[]$' -or $t -match '@["'']$') { return $true }
  }
  return $false
}

function New-Script([string]$File) {
  $lines = @(Get-Content -LiteralPath $File -Encoding UTF8)
  $out = New-Object System.Collections.Generic.List[string]
  $out.Add($Prelude.Replace('{state}', $StateFile))
  if (Test-Whole $lines) {
    $out.Add($LineStart)
    foreach ($line in $lines) { $out.Add($line) }
    $out.Add($LineCheck.Replace('{where}', 'the block'))
  } else {
    for ($n = 1; $n -le $lines.Count; $n++) {
      $line = $lines[$n - 1]
      if ($line.Trim() -eq '' -or $line.TrimStart().StartsWith('#')) { $out.Add($line); continue }
      $out.Add($LineStart)
      $out.Add($line)
      $out.Add($LineCheck.Replace('{where}', "line $n"))
    }
  }
  $out.Add($Epilogue.Replace('{state}', $StateFile))
  $script = Join-Path $Work ('block-' + [guid]::NewGuid().ToString('N') + '.ps1')
  Set-Content -LiteralPath $script -Value $out -Encoding UTF8
  return $script
}

# Run a block, print what it printed, and return that text.
function Invoke-Block([string]$Path) {
  $file = Show-Block $Path
  if ($Dry) { return '' }
  $script = New-Script $file
  $o = Join-Path $Work 'out.txt'
  $e = Join-Path $Work 'err.txt'
  $p = Start-Process -FilePath powershell.exe -NoNewWindow -PassThru -RedirectStandardOutput $o -RedirectStandardError $e `
    -ArgumentList @('-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', "`"$script`"")
  $null = $p.Handle
  $p.WaitForExit()
  $text = ''
  foreach ($f in @($o, $e)) {
    if (Test-Path -LiteralPath $f) { $text += [IO.File]::ReadAllText($f) }
  }
  foreach ($line in ($text -split "`r?`n")) { if ($line) { Write-Host "  > $line" } }
  if ($p.ExitCode -ne 0) {
    Write-Host "FAILED: $Path exited with code $($p.ExitCode)"
    exit 1
  }
  return $text
}

# Run a block and require what it printed to match a regular expression.
function Expect-Block([string]$Path, [string]$Pattern) {
  $text = Invoke-Block $Path
  if ($Dry) { return '' }
  if ($text -notmatch $Pattern) {
    Write-Host "FAILED: $Path did not print /$Pattern/"
    exit 1
  }
  return $text
}

# The two hashes a reader compares by eye: the file's, and the one the release lists.
function Assert-SameHash([string]$Text) {
  if ($Dry) { return }
  $hashes = @([regex]::Matches($Text, '\b[0-9a-fA-F]{64}\b') | ForEach-Object { $_.Value.ToLowerInvariant() })
  if ($hashes.Count -lt 2 -or $hashes[0] -ne $hashes[1]) {
    Write-Host "FAILED: the two lines do not match ($($hashes -join ' / '))"
    exit 1
  }
  Write-Host "  the two lines match: $($hashes[0])"
}

function Test-Pipe {
  $client = New-Object System.IO.Pipes.NamedPipeClientStream('.', 'geth.ipc', [System.IO.Pipes.PipeDirection]::InOut)
  try { $client.Connect(200); return $true } catch { return $false } finally { $client.Dispose() }
}

function Save-Window([int]$ProcessId, [string]$Log, [switch]$Interrupt) {
  $arguments = @('-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', "`"$Lib\ctrl-c.ps1`"",
    '-ProcessId', "$ProcessId", '-Log', "`"$Log`"")
  if (-not $Interrupt) { $arguments += '-ReadOnly' }
  $o = Join-Path $Work 'ctrl-c-out.txt'
  $e = Join-Path $Work 'ctrl-c-err.txt'
  $helper = Start-Process -FilePath powershell.exe -NoNewWindow -PassThru -RedirectStandardOutput $o -RedirectStandardError $e `
    -ArgumentList $arguments
  $null = $helper.Handle
  $helper.WaitForExit()
  if ($helper.ExitCode -ne 0) {
    Write-Host "FAILED: ctrl-c.ps1 exited with code $($helper.ExitCode)"
    foreach ($f in @($o, $e)) { if (Test-Path -LiteralPath $f) { Get-Content -LiteralPath $f | ForEach-Object { Write-Host "  > $_" } } }
    exit 1
  }
}

# Wait for the node's IPC endpoint, failing with the node window's text if it does not come up.
function Wait-Pipe([int]$Seconds = 240) {
  if ($Dry) { return }
  for ($i = 0; $i -lt $Seconds; $i++) {
    if (Test-Pipe) { Write-Host "  ready after ${i}s: \\.\pipe\geth.ipc"; return }
    Start-Sleep -Seconds 1
  }
  Write-Host "FAILED: no IPC endpoint at \\.\pipe\geth.ipc after ${Seconds}s"
  if ($script:NodeHost -and -not $script:NodeHost.HasExited) {
    $log = Join-Path $Work 'window.txt'
    Save-Window $script:NodeHost.Id $log
    Get-Content -LiteralPath $log -Encoding UTF8 | Select-Object -Last 40 | ForEach-Object { Write-Host "  > $_" }
  }
  exit 1
}

# Start a node block in a PowerShell window of its own, as a reader runs it, and wait for its IPC endpoint.
function Start-Node([string]$Path) {
  $file = Show-Block $Path
  if ($Dry) { return }
  $script = New-Script $file
  $script:NodeHost = Start-Process -FilePath powershell.exe -PassThru `
    -ArgumentList @('-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$script`"")
  $null = $script:NodeHost.Handle
  Wait-Pipe
}

# Press Ctrl+C once in the node's window, wait for the node to exit, check the window for a clean stop, then
# close the window: a PowerShell window, or the Startup folder's, which asks "Terminate batch job (Y/N)?".
function Stop-Node {
  if ($Dry) { return }
  $geth = @(Get-Process -Name geth -ErrorAction SilentlyContinue)
  if ($geth.Count -ne 1) {
    Write-Host "FAILED: expected one geth process, found $($geth.Count)"
    exit 1
  }
  $node = $geth[0]
  $null = $node.Handle
  $window = (Get-CimInstance Win32_Process -Filter "ProcessId = $($node.Id)").ParentProcessId
  $log = Join-Path $Work ('window-' + [guid]::NewGuid().ToString('N') + '.txt')
  Save-Window $node.Id $log -Interrupt
  if (-not $node.HasExited) {
    Write-Host 'FAILED: the node did not exit after Ctrl+C'
    exit 1
  }
  $text = [IO.File]::ReadAllText($log)
  ($text -split "`r?`n") | Where-Object { $_ } | Select-Object -Last 25 | ForEach-Object { Write-Host "  > $_" }
  if ($text -notmatch 'Blockchain stopped') {
    Write-Host 'FAILED: the window does not record a clean stop'
    exit 1
  }
  Write-Host '  the window records a clean stop'
  Stop-Process -Id $window -ErrorAction SilentlyContinue
  $script:NodeHost = $null
  for ($i = 0; $i -lt 60 -and (Test-Pipe); $i++) { Start-Sleep -Seconds 1 }
}
