#!/bin/bash
# The discovery and migration guides' Linux tabs on a v1.12.20 node, run in a terminal or as the systemd
# service: the node takes the v1.13 line's lists and bootnodes, then moves to the v1.13 line, rolls back, moves
# again and deletes the v1.12 binary. The terminal run is for a fresh container (tests/guides/in-container.sh),
# the service run for a GitHub Linux runner, where systemd runs.
# Usage: migrate/linux.sh terminal|systemd
set -e
. "$(dirname "$0")/../lib.sh"
. "$(dirname "$0")/v1.12.sh"

way=${1:?terminal or systemd}
case $way in
  terminal) W=in-a-terminal IPC=$HOME/.ethereum/classic/geth.ipc KEYS=$HOME/.ethereum/classic/geth CONFIG=$HOME/core-geth.toml ;;
  systemd) W=as-a-systemd-service IPC=/var/lib/core-geth/geth.ipc KEYS=/var/lib/core-geth/geth CONFIG=/etc/core-geth/config.toml ;;
  *) echo "unknown way: $way"; exit 2 ;;
esac

cd "$HOME"
M=migrate/move-panel-linux
G=discovery/discovery-panel-linux
N=migrate/name-panel-linux/ask-the-running-node-for-its-name/$W/0.txt
S=install/panel-linux/start-a-node-on-ethereum-classic/as-a-systemd-service
SERVICE_STOP=$M/stop-the-node-cleanly/as-a-systemd-service/0.txt
UNIT=/etc/systemd/system/core-geth.service

# Start the node: in a terminal, the block in the background; as the service, the block that starts it.
start() {
  if [ "$way" = terminal ]; then
    start_node "$1" test -S "$IPC"
  else
    paste "$1"
    wait_for "the service" sudo test -S "$IPC"
  fi
}

# Stop the node: Ctrl-C in its terminal, or the service's stop block, which checks the journal itself.
stop() {
  if [ "$way" = terminal ]; then stop_node; else expect "$1" 'Blockchain stopped'; fi
}

# The edit a step asks for in an editor, to the unit: unit <sudoedit block> <sed expression> <what it does>
unit() {
  skip "$1" "opens an editor; CI makes the edit the step describes"
  [ -n "$DRY" ] && return 0
  echo "  ci: $3"
  sudo sed -i "$2" "$UNIT"
  grep '^ExecStart=' "$UNIT"
}

say "Scaffolding: a $OLD_RELEASE node"
paste "$M/if-sudo-is-not-set-up-set-it-up/0.txt"
paste "$M/install-curl-and-unzip/debian-or-ubuntu/0.txt"
old_release linux
if [ "$way" = terminal ]; then
  start "$(scaffold 'geth --classic')"
else
  paste "$S/0.txt"
  paste "$S/1.txt"
  start "$S/2.txt"
fi
expect "$N" 'v1\.12\.20'

say "Discovery: start the v1.12 node with the v1.13 line's lists and bootnodes"
expect "$G/record-the-nodes-block-number/$W/0.txt" '^[0-9]+'
stop "$G/stop-the-node-cleanly/as-a-systemd-service/0.txt"
skip "$G/if-the-node-starts-from-a-config-file-update-it/0.txt" "the lines a config file holds; this node starts without one"
F=$G/start-it-with-the-vx-lines-lists-and-bootnodes/$W
if [ "$way" = terminal ]; then
  start "$F/0.txt"
else
  need "$F/1.txt"
  unit "$F/0.txt" "s|^ExecStart=.*|& $(sed 's/[|&\\]/\\&/g' "$(src "$F/1.txt")")|" \
    "the flags the next block shows, added to the end of ExecStart"
  skip "$F/1.txt" "the flags to add, which CI added above"
  start "$F/2.txt"
fi
expect "$G/confirm-the-node-holds-peers/$W/0.txt" '^[0-9]+'

say "Move: download and check, record, stop, install, rename the key, list static peers, start, confirm"
expect "$M/download-the-release-and-check-it/x86-64/0.txt" ': OK'
capture record "$M/record-the-nodes-block-number-and-id/$W/0.txt"
old=$(enode_id "$record")
stop "$SERVICE_STOP"
expect "$M/install-the-release/x86-64/0.txt" 'Core-Geth 1\.13\.'
paste "$M/rename-the-old-p2p-node-key/$W/0.txt"
ci sudo test -e "$KEYS/nodekey.old-rotated-$(date +%F)"
skip "$M/if-this-node-lists-static-peers-update-the-list/0.txt" "the lines the file holds, which the next block writes"
if [ "$way" = terminal ]; then
  paste "$M/if-this-node-lists-static-peers-update-the-list/in-a-terminal/0.txt"
  peers_in "$CONFIG" "$old"
  start "$(with_flags "$M/start-the-node/in-a-terminal/0.txt" "--mess=false --config $CONFIG")"
else
  paste "$M/if-this-node-lists-static-peers-update-the-list/as-a-systemd-service/0.txt"
  skip "$M/if-this-node-lists-static-peers-update-the-list/as-a-systemd-service/1.txt" \
    "opens an editor; CI makes the edit the note describes"
  peers_in "$CONFIG" "$old" sudo
  unit "$M/start-the-node/as-a-systemd-service/0.txt" "s|^ExecStart=.*|& --mess=false --config $CONFIG|" \
    "--mess=false and --config added to the end of ExecStart, as the steps ask"
  start "$M/start-the-node/as-a-systemd-service/1.txt"
fi
capture confirm "$M/confirm-the-move/$W/0.txt"
new=$(enode_id "$confirm")
differ "the node ID" "$old" "$new"
holds "the node's name" "$confirm" 'v1\.13\.'
if [ "$way" = terminal ]; then
  expect "$(with_ids "$M/if-other-nodes-list-this-node-give-them-the-new-id/0.txt" "$old" "$new")" 'true'
else
  skip "$M/if-other-nodes-list-this-node-give-them-the-new-id/0.txt" \
    "runs on the nodes that list this one; the terminal job runs it against a node"
fi

say "Roll back, then move again"
if [ "$way" = terminal ]; then
  stop_node
  paste "$M/if-you-need-to-roll-back/in-a-terminal/0.txt"
  start "$(with_flags "$M/if-you-need-to-roll-back/in-a-terminal/1.txt" "--config $CONFIG")"
else
  unit "$M/if-you-need-to-roll-back/as-a-systemd-service/0.txt" 's| --mess=false||' \
    "--mess=false taken out of ExecStart, as the step asks"
  start "$M/if-you-need-to-roll-back/as-a-systemd-service/1.txt"
fi
expect "$N" 'v1\.12\.20'
stop "$SERVICE_STOP"
expect "$M/install-the-release/x86-64/0.txt" 'Core-Geth 1\.13\.'
paste "$(renamed_again "$M/rename-the-old-p2p-node-key/$W/0.txt")"
ci sudo test -e "$KEYS/nodekey.old-rotated-$(date +%F)-2"
if [ "$way" = terminal ]; then
  start "$(with_flags "$M/start-the-node/in-a-terminal/0.txt" "--mess=false --config $CONFIG")"
else
  unit "$M/start-the-node/as-a-systemd-service/0.txt" 's|^ExecStart=.*|& --mess=false|' \
    "--mess=false added back to the end of ExecStart"
  start "$M/start-the-node/as-a-systemd-service/1.txt"
fi
capture confirm "$M/confirm-the-move/$W/0.txt"
differ "the node ID" "$new" "$(enode_id "$confirm")"
holds "the node's name" "$confirm" 'v1\.13\.'

say "Once the node is stable, delete the v1.12 binary"
paste "$M/once-the-node-is-stable-delete-the-vx-binary/0.txt"
ci test ! -e /usr/local/bin/geth-v1.12
stop "$SERVICE_STOP"

say "Done: the discovery and migration guides' Linux tabs ran, $way"
