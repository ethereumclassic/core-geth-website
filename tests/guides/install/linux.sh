#!/bin/bash
# The install guide's Linux tab in a terminal, on one distribution, run by tests/guides/in-container.sh in a
# fresh container of it: sudo, the tools, the release, a node started, checked and stopped, the update, the
# Verify tab with the GitHub CLI, and the dark band's start from the committed records.
# Usage: install/linux.sh debian|ubuntu|fedora|rocky|arch
set -e
. "$(dirname "$0")/../lib.sh"

case ${1:?distribution} in
  debian | ubuntu) tools=debian-or-ubuntu gh=debian-or-ubuntu sudo_way=debian ;;
  fedora) tools=fedora-or-rhel gh=fedora sudo_way=fedora-or-rhel ;;
  rocky) tools=fedora-or-rhel gh=rhel-or-centos sudo_way=fedora-or-rhel ;;
  arch) tools=arch gh=arch sudo_way=arch ;;
  *) echo "unknown distribution: $1"; exit 2 ;;
esac

cd "$HOME"
I=install/panel-linux
V=install/verify-panel-linux
D=discovery/dark-panel-linux
IPC=$HOME/.ethereum/classic/geth.ipc
ARCHIVE=$I/download-the-release-check-it-and-install-it/x86-64/0.txt

say "Check sudo"
paste "$I/if-sudo-is-not-set-up-set-it-up/0.txt"
skip "$I/if-sudo-is-not-set-up-set-it-up/$sudo_way/0.txt" "asks for the root password, and this account can already use sudo"

say "Install curl and unzip"
paste "$I/install-curl-and-unzip/$tools/0.txt"

say "Download the release, check it and install it"
expect "$ARCHIVE" 'Core-Geth 1\.13\.'

say "Start a node in a terminal, check it from a second one, and stop it with Ctrl-C"
start_node "$I/start-a-node-on-ethereum-classic/in-a-terminal/0.txt" test -S "$IPC"
expect "$I/check-that-it-syncs/in-a-terminal/0.txt" 'false|currentBlock'
stop_node

say "Update: with the node stopped, install the release again, then start it"
expect "$ARCHIVE" 'Core-Geth 1\.13\.'
start_node "$I/when-a-new-release-ships-update-the-node/in-a-terminal/0.txt" test -S "$IPC"
stop_node

say "Verify: install the GitHub CLI, then run the line again, as a reader does to update it"
paste "$V/if-sudo-is-not-set-up-set-it-up/0.txt"
paste "$V/install-or-update-the-github-cli/$gh/0.txt"
paste "$V/install-or-update-the-github-cli/$gh/0.txt"
if [ -n "${GH_TOKEN:-}" ] || [ -n "$DRY" ]; then
  expect "$V/check-the-github-cli/0.txt" 'Logged in to github\.com'
  skip "$V/check-the-github-cli/1.txt" "signs in through a browser; the job's own token signs the GitHub CLI in"
  expect "$V/check-an-archive/x86-64/0.txt" 'Verification succeeded'
else
  skip "$V/check-an-archive/x86-64/0.txt" "needs a signed-in GitHub CLI, and no GH_TOKEN was given"
fi

say "Dark band: start the node once from the committed records"
paste "$D/if-sudo-is-not-set-up-set-it-up/0.txt"
paste "$D/install-curl-and-jq/$tools/0.txt"
expect "$D/check-that-curl-and-jq-are-installed/0.txt" 'jq-1\.'
start_node "$D/start-the-node-once-from-the-committed-records/in-a-terminal/0.txt" test -S "$IPC"
expect "$D/check-that-it-holds-peers-then-start-it-the-usual-way/in-a-terminal/0.txt" '^[0-9]+$'
stop_node

say "Done: the install guide's Linux tab ran on $1"
