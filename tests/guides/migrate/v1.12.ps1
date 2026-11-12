# The migration workflow's scaffolding for Windows, dot-sourced after lib.ps1: a v1.12.20 node, the release
# etclabscore/core-geth published last before the client moved to ethereumclassic/core-geth, unpacked where a
# reader on the v1.12 line keeps one. None of this is a guide step, and it retires with the migration workflow.

$OldRelease = 'v1.12.20'
$OldBase = "https://github.com/etclabscore/core-geth/releases/download/$OldRelease"

function Install-OldRelease {
  Say "Scaffolding: install $OldRelease in C:\core-geth, as a node on the v1.12 line has it"
  if ($Dry) { return }
  $zip = "core-geth-win64-$OldRelease.zip"
  $ProgressPreference = 'SilentlyContinue'
  Invoke-WebRequest "$OldBase/$zip" -OutFile "$Work\$zip" -UseBasicParsing
  Invoke-WebRequest "$OldBase/$zip.sha256" -OutFile "$Work\$zip.sha256" -UseBasicParsing
  # This release's checksum file is Get-FileHash's own table, in UTF-16.
  $listed = [regex]::Match((Get-Content -LiteralPath "$Work\$zip.sha256" -Raw), '[0-9A-Fa-f]{64}').Value
  $actual = (Get-FileHash -LiteralPath "$Work\$zip" -Algorithm SHA256).Hash
  if (-not $listed -or $listed -ne $actual) {
    Write-Host "FAILED: $zip does not match its checksum ($listed / $actual)"
    exit 1
  }
  Expand-Archive -LiteralPath "$Work\$zip" -DestinationPath 'C:\core-geth' -Force
  # Windows PowerShell makes a native command's stderr an error record once it is redirected.
  $ErrorActionPreference = 'Continue'
  $version = (& 'C:\core-geth\geth.exe' version 2>&1 | Out-String)
  if ($version -notmatch '1\.12\.20') {
    Write-Host $version
    Write-Host "FAILED: C:\core-geth\geth.exe is not $OldRelease"
    exit 1
  }
  Write-Host "  $OldRelease unpacked in C:\core-geth"
}

# A block of CI's own, such as the scaffolding's start, written where the functions in lib.ps1 can run it.
function New-Scaffold([string[]]$Lines) {
  $file = Join-Path $Work ('scaffold-' + [guid]::NewGuid().ToString('N') + '.txt')
  [IO.File]::WriteAllLines($file, $Lines)
  [IO.File]::WriteAllText("$file.why", "CI's scaffolding, not a guide step")
  return $file
}

# The edit the static peers step asks for in Notepad, a real entry in place of the example, saved as UTF-8 with
# no byte order mark as its note says: this node's own old ID at an address nothing listens on.
function Set-Peers([string]$File, [string]$Enode) {
  if ($Dry) { return }
  Write-Host "  ci: the note's edit, an entry in place of the example, in $File"
  $text = [IO.File]::ReadAllText($File).Replace('enode://<node ID>@<IP>:30303', "$Enode@127.0.0.1:30399")
  [IO.File]::WriteAllText($File, $text)
  Get-Content -LiteralPath $File | ForEach-Object { Write-Host "  | $_" }
}

# A copy of the "give them the new ID" block with this node's IDs in place of the placeholders, run against
# this node itself, which stands in for the nodes that list it.
function New-WithIds([string]$Path, [string]$Before, [string]$After) {
  return New-Copy $Path "with this node's old and new IDs and 127.0.0.1 in place of the placeholders" {
    param($text)
    $text.Replace('<old ID>', $Before.Replace('enode://', '')).Replace('<new ID>', $After.Replace('enode://', '')).Replace('@<IP>:', '@127.0.0.1:')
  }
}
