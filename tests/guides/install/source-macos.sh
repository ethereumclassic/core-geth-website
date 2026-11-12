#!/bin/zsh
# The install guide's Source tab for macOS, in zsh: Go, the main branch built and installed, a node started
# and stopped, the commit checked, then a second build from a new terminal, as an update runs.
# Usage: install/source-macos.sh apple-silicon|intel
set -e
. "$(dirname "$0")/../lib.sh"

cpu=${1:?apple-silicon or intel}
cd "$HOME"
I=install/source-panel-macos
V=install/verify-source-panel-macos
IPC=$HOME/Library/Ethereum/classic/geth.ipc

say "The Command Line Tools"
skip "$I/install-the-xcode-command-line-tools/0.txt" "opens an installer window, and the runner image has the tools"
ci xcode-select -p

say "Install Go, then check the tools"
expect "$I/install-go-x/$cpu/0.txt" 'go version go1\.'
expect "$I/check-the-tools/0.txt" 'GNU Make'

say "Build the main branch and install the build"
paste "$I/build-the-main-branch/first-build/0.txt"
expect "$I/install-the-build/0.txt" 'Core-Geth 1\.'

say "Start a node, check it, stop it, and check the commit"
start_node "$I/start-a-node-on-ethereum-classic/in-a-terminal/0.txt" test -S "$IPC"
expect "$I/check-that-it-syncs/0.txt" 'false|currentBlock'
stop_node
expect "$V/check-the-commit-you-built/0.txt" 'vcs\.revision='

say "Update: build again from a new terminal, which opens in the home folder"
cd "$HOME"
paste "$I/build-the-main-branch/build-again/0.txt"
expect "$I/install-the-build/0.txt" 'Core-Geth 1\.'
start_node "$I/update-to-a-newer-build-of-main/in-a-terminal/0.txt" test -S "$IPC"
stop_node

say "Done: the install guide's Source tab ran on $cpu"
