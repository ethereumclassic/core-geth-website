#!/bin/bash
# The install guide's Source tab for Linux on one distribution, run by tests/guides/in-container.sh in a fresh
# container of it: the tools, Go, the main branch built and installed, a node started and stopped, the commit
# checked, then a second build from a new terminal, as an update runs.
# Usage: install/source-linux.sh debian|ubuntu|fedora|rocky|arch
set -e
. "$(dirname "$0")/../lib.sh"

case ${1:?distribution} in
  debian | ubuntu) tools=debian-or-ubuntu sudo_way=debian ;;
  fedora | rocky) tools=fedora-or-rhel sudo_way=fedora-or-rhel ;;
  arch) tools=arch sudo_way=arch ;;
  *) echo "unknown distribution: $1"; exit 2 ;;
esac

cd "$HOME"
I=install/source-panel-linux
V=install/verify-source-panel-linux
IPC=$HOME/.ethereum/classic/geth.ipc

say "Check sudo"
paste "$I/if-sudo-is-not-set-up-set-it-up/0.txt"
skip "$I/if-sudo-is-not-set-up-set-it-up/$sudo_way/0.txt" "asks for the root password, and this account can already use sudo"

say "Install the tools and Go, then check them"
paste "$I/install-git-a-c-compiler-and-make/$tools/0.txt"
expect "$I/install-go-x/x86-64/0.txt" 'go version go1\.'
expect "$I/check-the-tools/0.txt" 'GNU Make'

say "Build the main branch and install the build"
paste "$I/build-the-main-branch/first-build/0.txt"
expect "$I/install-the-build/0.txt" 'Core-Geth 1\.'

say "Start a node, check it, stop it, and check the commit"
start_node "$I/start-a-node-on-ethereum-classic/in-a-terminal/0.txt" test -S "$IPC"
expect "$I/check-that-it-syncs/in-a-terminal/0.txt" 'false|currentBlock'
stop_node
expect "$V/check-the-commit-you-built/0.txt" 'vcs\.revision='

say "Update: build again from a new terminal, which opens in the home folder"
cd "$HOME"
paste "$I/build-the-main-branch/build-again/0.txt"
expect "$I/install-the-build/0.txt" 'Core-Geth 1\.'
start_node "$I/update-to-a-newer-build-of-main/in-a-terminal/0.txt" test -S "$IPC"
stop_node

say "Done: the install guide's Source tab ran on $1"
