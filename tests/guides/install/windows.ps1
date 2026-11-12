# The install guide's Windows tab in Windows PowerShell 5.1: the release checked and unpacked, a node in a
# PowerShell window and from the Startup folder, each started, checked, updated and stopped with Ctrl+C, the
# Verify tab, and the dark band's start from the committed records.
. "$PSScriptRoot\..\lib.ps1"

$I = 'install/panel-windows'
$V = 'install/verify-panel-windows'
$D = 'discovery/dark-panel-windows'
$Download = "$I/download-the-release-and-check-it/0.txt"
$Unpack = "$I/if-the-two-lines-match-unpack-the-release/0.txt"
$Sync = "$I/check-that-it-syncs/0.txt"
$Startup = "$I/start-a-node-on-ethereum-classic/from-the-startup-folder"

function Install-Release {
  Assert-SameHash (Invoke-Block $Download)
  $null = Expect-Block $Unpack 'Core-Geth 1\.13\.'
}

New-Window
Say 'Download the release, compare the two lines, unpack it'
Install-Release

Say 'Start a node in a PowerShell window, check it from a second one, and stop it with Ctrl+C'
Start-Node "$I/start-a-node-on-ethereum-classic/in-a-powershell-window/0.txt"
New-Window
$null = Expect-Block $Sync 'false|currentBlock'
Stop-Node

Say 'Update: with the node stopped, download and unpack the release again, then start it'
Install-Release
Start-Node "$I/when-a-new-release-ships-update-the-node/in-a-powershell-window/0.txt"
Stop-Node

Say 'Start a node from the Startup folder'
New-Window
$null = Invoke-Block "$Startup/0.txt"
$null = Invoke-Block "$Startup/1.txt"
Wait-Pipe
$null = Expect-Block $Sync 'false|currentBlock'
Stop-Node

Say 'Update the Startup folder node'
New-Window
Install-Release
$null = Invoke-Block "$I/when-a-new-release-ships-update-the-node/from-the-startup-folder/0.txt"
Wait-Pipe
Stop-Node

Say 'Verify: the GitHub CLI and the archive'
if ($Dry -or (Get-Command winget -ErrorAction SilentlyContinue)) {
  $null = Invoke-Block "$V/install-or-update-the-github-cli/0.txt"
} else {
  Skip-Block "$V/install-or-update-the-github-cli/0.txt" 'WinGet is not on this runner image, which ships the GitHub CLI'
}
$null = Expect-Block "$V/check-the-github-cli/0.txt" 'Logged in to github\.com'
Skip-Block "$V/check-the-github-cli/1.txt" "signs in through a browser; the job's own token signs the GitHub CLI in"
New-Window
$text = Expect-Block "$V/check-an-archive/0.txt" 'Verification succeeded'
Assert-SameHash $text

Say 'Dark band: in the folder that holds geth.exe, read the committed records and start once from them'
New-Window
Set-Here 'C:\core-geth'
$null = Expect-Block "$D/read-the-committed-records/0.txt" '(?m)^True\s*$'
Start-Node "$D/start-the-node-once-from-them/0.txt"
New-Window
Set-Here 'C:\core-geth'
$null = Expect-Block "$D/check-that-it-holds-peers-then-start-it-the-usual-way/0.txt" '(?m)^\d+\s*$'
Stop-Node
$null = Invoke-Block "$D/check-that-it-holds-peers-then-start-it-the-usual-way/from-the-startup-folder/0.txt"
Wait-Pipe
Stop-Node

if (-not $Dry) {
  # The note's own command, so the runner does not start a node at its next sign-in.
  Remove-Item "$([Environment]::GetFolderPath('Startup'))\core-geth-classic.cmd"
}
Say "Done: the install guide's Windows tab ran"
