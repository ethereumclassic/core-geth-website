# The install guide's Source tab for Windows in Windows PowerShell 5.1, run as an administrator, as the tab
# asks: Chocolatey, Git and a C compiler, Go from its installer, the main branch built and installed, a node
# started and stopped, the commit checked, then a second build, as an update runs.
. "$PSScriptRoot\..\lib.ps1"

$I = 'install/source-panel-windows'
$V = 'install/verify-source-panel-windows'

if (-not $Dry) {
  # The runner image puts a Go of its own on the machine PATH; a machine the tab is written for has none.
  foreach ($scope in 'Machine', 'User') {
    $entries = [Environment]::GetEnvironmentVariable('Path', $scope) -split ';'
    $kept = ($entries | Where-Object { $_ -and $_ -notmatch '\\go\\\d+\.\d+' }) -join ';'
    [Environment]::SetEnvironmentVariable('Path', $kept, $scope)
  }
  Write-Host "  ci: the runner image's Go taken off PATH"
}
$pinned = [regex]::Match([IO.File]::ReadAllText((Get-BlockFile "$I/download-go-x-and-check-it/0.txt")), 'go\d+\.\d+\.\d+').Value

New-Window
Say 'Chocolatey'
$version = Expect-Block "$I/check-for-chocolatey/0.txt" '(?m)^\d+\.\d+'
Skip-Block "$I/if-chocolatey-is-not-installed-install-it/0.txt" 'Chocolatey is on the runner image'
if ($version -match '(?m)^1\.') {
  $null = Invoke-Block "$I/if-chocolatey-is-version-1-move-it-to-x-first/0.txt"
} else {
  Skip-Block "$I/if-chocolatey-is-version-1-move-it-to-x-first/0.txt" "the runner's Chocolatey is not version 1"
}
$null = Expect-Block "$I/update-chocolatey-then-install-git-and-a-c-compiler/0.txt" '(?m)^\d+\.\d+'

Say 'Go, then the tools'
$null = Expect-Block "$I/download-go-x-and-check-it/0.txt" '(?m)^True\s*$'
$null = Invoke-Block "$I/if-the-check-printed-true-run-the-go-installer/0.txt"
$null = Expect-Block "$I/check-the-tools/0.txt" "go version $pinned "

Say 'Build the main branch and install the build'
$null = Expect-Block "$I/build-the-main-branch/first-build/0.txt" 'Core-Geth 1\.'
$null = Expect-Block "$I/install-the-build/0.txt" 'Core-Geth 1\.'

Say 'Start a node, check it, stop it, and check the commit'
Start-Node "$I/start-a-node-on-ethereum-classic/in-a-powershell-window/0.txt"
New-Window
$null = Expect-Block "$I/check-that-it-syncs/0.txt" 'false|currentBlock'
Stop-Node
Set-Here "$HOME\core-geth"
$null = Expect-Block "$V/check-the-commit-you-built/0.txt" 'vcs\.revision='

Say 'Update: build again, install it, start the node'
New-Window
$null = Expect-Block "$I/build-the-main-branch/build-again/0.txt" 'Core-Geth 1\.'
$null = Expect-Block "$I/install-the-build/0.txt" 'Core-Geth 1\.'
Start-Node "$I/update-to-a-newer-build-of-main/in-a-powershell-window/0.txt"
Stop-Node

Say "Done: the install guide's Source tab ran on Windows"
