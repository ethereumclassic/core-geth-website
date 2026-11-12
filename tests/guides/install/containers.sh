#!/bin/bash
# The install guide's Containers tab on a GitHub Linux runner, which has Docker and the GitHub CLI: the image
# pulled and checked, a node started in a container, checked, updated and stopped, the Verify tab's image
# file, and the dark band's start from the committed records in a container of its own.
# Usage: install/containers.sh x86-64|arm64
set -e
. "$(dirname "$0")/../lib.sh"

case ${1:?x86-64 or arm64} in
  x86-64) host=x86-64-linux ;;
  arm64) host=arm64-linux ;;
  *) echo "unknown processor: $1"; exit 2 ;;
esac

cd "$HOME"
C=install/panel-containers
V=install/verify-panel-containers
D=discovery/dark-panel-containers
IPC=/root/.ethereum/classic/geth.ipc
START=$C/start-a-node-keeping-the-chain-in-a-named-volume/0.txt
LOGS=$C/check-that-it-syncs/0.txt
PULL=$C/pull-the-published-image-and-check-where-it-came-from/0.txt

# The dark band's commands name the container core-geth, and its note says to put your own name in its place.
named() {
  edited "$1" "with core-geth-classic, the name this guide's container has, in place of core-geth, as the note asks" \
    -E 's/ core-geth( |$)/ core-geth-classic\1/g'
}

say "Check Docker and the GitHub CLI"
expect "$C/check-docker-and-the-github-cli/0.txt" 'Logged in to github\.com'
skip "$C/check-docker-and-the-github-cli/1.txt" "signs in through a browser; the job's own token signs the GitHub CLI in"

say "Pull the image, check where it came from, and start a node"
expect "$PULL" 'Verification succeeded'
paste "$START"
start_node "$LOGS" docker exec core-geth-classic test -S "$IPC"
expect "$C/check-that-it-syncs/1.txt" 'false|currentBlock'

say "Update: stop and remove the container, pull again, start a new one"
stop_node paste "$C/when-a-new-release-ships-update-the-node/0.txt"
expect "$PULL" 'Verification succeeded'
paste "$START"
start_node "$LOGS" docker exec core-geth-classic test -S "$IPC"

say "Verify: check an image file and load it"
expect "$V/check-docker-and-the-github-cli/0.txt" 'Logged in to github\.com'
expect "$V/check-an-image-file/$host/0.txt" 'Verification succeeded'
expect "$V/load-the-image/$1/0.txt" 'Loaded image'

say "Dark band: stop the node, start once from the committed records in a container of its own"
paste "$D/install-curl-and-jq/debian-or-ubuntu/0.txt"
expect "$D/check-that-curl-and-jq-are-installed/0.txt" 'jq-1\.'
stop_node paste "$(named "$D/stop-the-node-cleanly/0.txt")"
start_node "$(in_terminal "$(named "$D/start-it-once-from-the-committed-records-in-a-container-of-its-own/0.txt")")" \
  docker exec core-geth-records test -S "$IPC"
expect "$D/check-that-it-holds-peers-then-start-it-the-usual-way/0.txt" '^[0-9]+'
stop_node ci docker kill --signal=INT core-geth-records
paste "$(named "$D/check-that-it-holds-peers-then-start-it-the-usual-way/1.txt")"
start_node "$LOGS" docker exec core-geth-classic test -S "$IPC"

say "Stop the node"
stop_node ci docker stop -t 300 core-geth-classic

say "Done: the install guide's Containers tab ran on $1"
