#!/bin/bash
# The install guide's Linux tab with the node run as the systemd service, on a GitHub Linux runner, where
# systemd runs: the release, the service set up, started, checked, updated and stopped, then the dark band's
# start from the committed records with the service's data, and the service started again.
# The runner image ships the GitHub CLI, so the Verify tab checks the archive without installing it; the
# distribution jobs run the install lines on fresh systems.
# Usage: install/linux-service.sh x86-64|arm64
set -e
. "$(dirname "$0")/../lib.sh"

cpu=${1:?x86-64 or arm64}
cd "$HOME"
I=install/panel-linux
V=install/verify-panel-linux
D=discovery/dark-panel-linux
S=$I/start-a-node-on-ethereum-classic/as-a-systemd-service
U=$I/when-a-new-release-ships-update-the-node/as-a-systemd-service
IPC=/var/lib/core-geth/geth.ipc
ARCHIVE=$I/download-the-release-check-it-and-install-it/$cpu/0.txt

say "Check sudo, install curl and unzip"
paste "$I/if-sudo-is-not-set-up-set-it-up/0.txt"
paste "$I/install-curl-and-unzip/debian-or-ubuntu/0.txt"

say "Download the release, check it and install it"
expect "$ARCHIVE" 'Core-Geth 1\.13\.'

say "Set up the service and start it"
paste "$S/0.txt"
paste "$S/1.txt"
paste "$S/2.txt"
follow "$S/3.txt" 15
wait_for "the service" sudo test -S "$IPC"
expect "$I/check-that-it-syncs/as-a-systemd-service/0.txt" 'false|currentBlock'

say "Update: stop the service, install the release again, start it"
t=$(date +%s)
paste "$U/0.txt"
journal_since "$t"
expect "$ARCHIVE" 'Core-Geth 1\.13\.'
paste "$U/1.txt"
wait_for "the service" sudo test -S "$IPC"

say "Verify the archive"
skip "$V/install-or-update-the-github-cli/debian-or-ubuntu/0.txt" "the runner image ships the GitHub CLI; the distribution jobs run this line on fresh systems"
if [ -n "${GH_TOKEN:-}" ] || [ -n "$DRY" ]; then
  expect "$V/check-the-github-cli/0.txt" 'Logged in to github\.com'
  expect "$V/check-an-archive/$cpu/0.txt" ': OK'
fi

say "Dark band: stop the service, start once from the committed records, then start the service again"
expect "$D/stop-the-node-cleanly/as-a-systemd-service/0.txt" 'Blockchain stopped'
paste "$D/install-curl-and-jq/debian-or-ubuntu/0.txt"
expect "$D/check-that-curl-and-jq-are-installed/0.txt" 'jq-1\.'
start_node "$D/start-the-node-once-from-the-committed-records/as-a-systemd-service/0.txt" sudo test -S "$IPC"
expect "$D/check-that-it-holds-peers-then-start-it-the-usual-way/as-a-systemd-service/0.txt" '^[0-9]+$'
stop_node
paste "$D/check-that-it-holds-peers-then-start-it-the-usual-way/as-a-systemd-service/1.txt"
wait_for "the service" sudo test -S "$IPC"

say "Stop the service"
t=$(date +%s)
paste "$U/0.txt"
journal_since "$t"

say "Done: the install guide's systemd service ran on $cpu"
