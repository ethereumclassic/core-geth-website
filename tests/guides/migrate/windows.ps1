# The discovery and migration guides' Windows tabs on a v1.12.20 node, run in a PowerShell window or from the
# Startup folder: the node takes the v1.13 line's lists and bootnodes, then moves to the v1.13 line, rolls
# back, moves again and deletes the v1.12 binary. Each start and stop is a reader's: Ctrl+C in the node's window.
param([Parameter(Mandatory = $true)][ValidateSet('window', 'startup')][string]$Way)
. "$PSScriptRoot\..\lib.ps1"
. "$PSScriptRoot\v1.12.ps1"

$M = 'migrate/move-panel-windows'
$G = 'discovery/discovery-panel-windows'
$Name = 'migrate/name-panel-windows/ask-the-running-node-for-its-name/0.txt'
$Startup = 'install/panel-windows/start-a-node-on-ethereum-classic/from-the-startup-folder'
$Keys = "$env:LOCALAPPDATA\Ethereum\classic\geth"
$Cmd = "$([Environment]::GetFolderPath('Startup'))\core-geth-classic.cmd"
$Config = 'C:\core-geth\config.toml'
$Today = Get-Date -Format yyyy-MM-dd

# A second window, in the folder that holds geth.exe, as the steps have the reader open one.
function Open-Second {
  New-Window
  Set-Here 'C:\core-geth'
}

# The edit a step asks for in Notepad, to the Startup folder's command file.
function Edit-Cmd([string]$NotepadBlock, [string]$Why, [scriptblock]$Change) {
  Skip-Block $NotepadBlock 'opens Notepad; CI makes the edit the step describes'
  if ($Dry) { return }
  Write-Host "  ci: $Why"
  [IO.File]::WriteAllText($Cmd, (& $Change ([IO.File]::ReadAllText($Cmd))))
  Get-Content -LiteralPath $Cmd | ForEach-Object { Write-Host "  | $_" }
}

function Start-FromFolder([string]$Block) {
  $null = Invoke-Block $Block
  Wait-Pipe
}

Install-OldRelease
Open-Second
if ($Way -eq 'window') {
  Start-Node (New-Scaffold @('cd C:\core-geth', '.\geth.exe --classic'))
} else {
  $null = Invoke-Block "$Startup/0.txt"
  Start-FromFolder "$Startup/1.txt"
}
Open-Second
$null = Expect-Block $Name 'v1\.12\.20'

Say "Discovery: start the v1.12 node with the v1.13 line's lists and bootnodes"
$null = Expect-Block "$G/record-the-nodes-block-number/0.txt" '(?m)^\d+'
Stop-Node
Skip-Block "$G/if-the-node-starts-from-a-config-file-update-it/0.txt" 'the lines a config file holds; this node starts without one'
$F = "$G/start-it-with-the-vx-lines-lists-and-bootnodes"
if ($Way -eq 'window') {
  Start-Node "$F/in-a-powershell-window/0.txt"
} else {
  $flags = [IO.File]::ReadAllText((Get-BlockFile "$F/from-the-startup-folder/1.txt")).Trim()
  Edit-Cmd "$F/from-the-startup-folder/0.txt" 'the flags the next block shows, added after --classic' {
    param($text) $text.Replace('" --classic', "`" --classic $flags")
  }
  Skip-Block "$F/from-the-startup-folder/1.txt" 'the flags to add, which CI added above'
  Start-FromFolder "$F/from-the-startup-folder/2.txt"
}
Open-Second
$null = Expect-Block "$G/confirm-the-node-holds-peers/0.txt" '(?m)^\d+'

Say 'Move: download and check, record, stop, install, rename the key, list static peers, start, confirm'
Assert-SameHash (Invoke-Block "$M/download-the-release-and-check-it/0.txt")
$old = Get-EnodeId (Invoke-Block "$M/record-the-nodes-block-number-and-id/0.txt")
Stop-Node
$null = Expect-Block "$M/install-the-release/0.txt" 'Core-Geth 1\.13\.'
$null = Invoke-Block "$M/rename-the-old-p2p-node-key/0.txt"
Assert-Path "$Keys\nodekey.old-rotated-$Today"
Skip-Block "$M/if-this-node-lists-static-peers-update-the-list/0.txt" 'the lines the file holds, which the next block writes'
$null = Invoke-Block "$M/if-this-node-lists-static-peers-update-the-list/1.txt"
Skip-Block "$M/if-this-node-lists-static-peers-update-the-list/2.txt" 'opens Notepad; CI makes the edit the note describes'
Set-Peers $Config $old
if ($Way -eq 'window') {
  Start-Node (Add-Flags "$M/start-the-node/in-a-powershell-window/0.txt" "--mess=false --config $Config")
} else {
  Edit-Cmd "$M/start-the-node/from-the-startup-folder/0.txt" '--mess=false and --config added after --classic, as the steps ask' {
    param($text) $text.Replace('" --classic', "`" --classic --mess=false --config $Config")
  }
  Start-FromFolder "$M/start-the-node/from-the-startup-folder/1.txt"
}
Open-Second
$confirm = Invoke-Block "$M/confirm-the-move/0.txt"
$new = Get-EnodeId $confirm
Assert-Differ 'the node ID' $old $new
Assert-Holds "the node's name" $confirm 'v1\.13\.'
if ($Way -eq 'window') {
  $null = Expect-Block (New-WithIds "$M/if-other-nodes-list-this-node-give-them-the-new-id/0.txt" $old $new) 'true'
} else {
  Skip-Block "$M/if-other-nodes-list-this-node-give-them-the-new-id/0.txt" 'runs on the nodes that list this one; the window job runs it against a node'
}

Say 'Roll back, then move again'
Stop-Node
$null = Invoke-Block "$M/if-you-need-to-roll-back/0.txt"
if ($Way -eq 'window') {
  Start-Node (Add-Flags "$M/if-you-need-to-roll-back/in-a-powershell-window/0.txt" "--config $Config")
} else {
  Edit-Cmd "$M/if-you-need-to-roll-back/from-the-startup-folder/0.txt" '--mess=false taken out, as the step asks' {
    param($text) $text.Replace(' --mess=false', '')
  }
  Start-FromFolder "$M/if-you-need-to-roll-back/from-the-startup-folder/1.txt"
}
Open-Second
$null = Expect-Block $Name 'v1\.12\.20'
Stop-Node
$null = Expect-Block "$M/install-the-release/0.txt" 'Core-Geth 1\.13\.'
$null = Invoke-Block (New-Copy "$M/rename-the-old-p2p-node-key/0.txt" 'with -2 after the date, as the rollback note asks of a second rename on the same day' {
    param($text) $text.Replace('$(Get-Date -Format yyyy-MM-dd)', '$(Get-Date -Format yyyy-MM-dd)-2')
  })
Assert-Path "$Keys\nodekey.old-rotated-$Today-2"
if ($Way -eq 'window') {
  Start-Node (Add-Flags "$M/start-the-node/in-a-powershell-window/0.txt" "--mess=false --config $Config")
} else {
  Edit-Cmd "$M/start-the-node/from-the-startup-folder/0.txt" '--mess=false added back after --classic' {
    param($text) $text.Replace('" --classic', '" --classic --mess=false')
  }
  Start-FromFolder "$M/start-the-node/from-the-startup-folder/1.txt"
}
Open-Second
$confirm = Invoke-Block "$M/confirm-the-move/0.txt"
Assert-Differ 'the node ID' $new (Get-EnodeId $confirm)
Assert-Holds "the node's name" $confirm 'v1\.13\.'

Say 'Once the node is stable, delete the v1.12 binary'
$null = Invoke-Block "$M/once-the-node-is-stable-delete-the-vx-binary/0.txt"
Assert-Path 'C:\core-geth\geth-v1.12.exe' -Missing
Stop-Node
if (-not $Dry -and (Test-Path -LiteralPath $Cmd)) { Remove-Item -LiteralPath $Cmd }
Say "Done: the discovery and migration guides' Windows tabs ran, $Way"
