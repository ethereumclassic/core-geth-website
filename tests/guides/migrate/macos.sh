#!/bin/zsh
# The discovery and migration guides' macOS tabs on a v1.12.20 node, in zsh, run in a terminal or as the
# launchd agent: the node takes the v1.13 line's lists and bootnodes, then moves to the v1.13 line, rolls back,
# moves again and deletes the v1.12 binary. The v1.12.20 release is an Intel build, which Apple Silicon runs
# through Rosetta.
# Usage: migrate/macos.sh terminal|launchd intel|apple-silicon
set -e
. "$(dirname "$0")/../lib.sh"
. "$(dirname "$0")/v1.12.sh"

way=${1:?terminal or launchd}
cpu=${2:?intel or apple-silicon}
case $way in terminal | launchd) ;; *) echo "unknown way: $way"; exit 2 ;; esac

cd "$HOME"
M=migrate/move-panel-macos
G=discovery/discovery-panel-macos
N=migrate/name-panel-macos/ask-the-running-node-for-its-name/0.txt
A=install/panel-macos/start-a-node-on-ethereum-classic/as-a-launchd-agent
IPC=$HOME/Library/Ethereum/classic/geth.ipc
KEYS=$HOME/Library/Ethereum/classic/geth
PLIST=$HOME/Library/LaunchAgents/com.coregeth.classic.plist
AGENT_LOG=$HOME/Library/Logs/core-geth-classic.log
CONFIG=$HOME/core-geth.toml

start() {
  if [ "$way" = terminal ]; then
    start_node "$1" test -S "$IPC"
  else
    paste "$1"
    wait_for "the agent" test -S "$IPC"
  fi
}

# Stop the node: Ctrl-C in its terminal, or the agent's stop block, which follows its log.
stop() {
  if [ "$way" = terminal ]; then
    stop_node
  else
    _m=$(log_mark "$AGENT_LOG")
    follow "$1" 30
    wait_gone test -S "$IPC"
    clean_since "$AGENT_LOG" "$_m"
  fi
}

# The edits a step asks for in TextEdit, to the agent's ProgramArguments: lines added after --classic, or a
# line taken out. agent <open -e block> add|drop <lines or pattern> <what it does>
agent() {
  skip "$1" "opens TextEdit; CI makes the edit the step describes"
  [ -n "$DRY" ] && return 0
  echo "  ci: $4"
  if [ "$2" = add ]; then
    printf '%s\n' "$3" > "$WORK/agent-lines"
    sed -i '' "/<string>--classic<\/string>/r $WORK/agent-lines" "$PLIST"
  else
    sed -i '' "/$3/d" "$PLIST"
  fi
  plutil -lint "$PLIST"
  grep '<string>' "$PLIST"
}

old_release osx
if [ "$way" = terminal ]; then
  start "$(scaffold 'geth --classic')"
else
  paste "$A/0.txt"
  start "$A/1.txt"
fi
expect "$N" 'v1\.12\.20'

say "Discovery: start the v1.12 node with the v1.13 line's lists and bootnodes"
expect "$G/record-the-nodes-block-number/0.txt" '^[0-9]+'
stop "$G/stop-the-node-cleanly/as-a-launchd-agent/0.txt"
skip "$G/if-the-node-starts-from-a-config-file-update-it/0.txt" "the lines a config file holds; this node starts without one"
F=$G/start-it-with-the-vx-lines-lists-and-bootnodes
if [ "$way" = terminal ]; then
  start "$F/in-a-terminal/0.txt"
else
  need "$F/as-a-launchd-agent/1.txt"
  agent "$F/as-a-launchd-agent/0.txt" add "$(cat "$(src "$F/as-a-launchd-agent/1.txt")")" \
    "the lines the next block shows, added after --classic"
  skip "$F/as-a-launchd-agent/1.txt" "the lines to add, which CI added above"
  start "$F/as-a-launchd-agent/2.txt"
fi
expect "$G/confirm-the-node-holds-peers/0.txt" '^[0-9]+'

say "Move: download and check, record, stop, install, rename the key, list static peers, start, confirm"
expect "$M/download-the-release-and-check-it/$cpu/0.txt" ': OK'
capture record "$M/record-the-nodes-block-number-and-id/0.txt"
old=$(enode_id "$record")
stop "$M/stop-the-node-cleanly/as-a-launchd-agent/0.txt"
expect "$M/install-the-release/$cpu/0.txt" 'Core-Geth 1\.13\.'
paste "$M/rename-the-old-p2p-node-key/0.txt"
ci test -e "$KEYS/nodekey.old-rotated-$(date +%F)"
skip "$M/if-this-node-lists-static-peers-update-the-list/0.txt" "the lines the file holds, which the next block writes"
paste "$M/if-this-node-lists-static-peers-update-the-list/1.txt"
peers_in "$CONFIG" "$old"
if [ "$way" = terminal ]; then
  skip "$M/if-this-node-lists-static-peers-update-the-list/2.txt" "prints the line for the launchd agent"
  start "$(with_flags "$M/start-the-node/in-a-terminal/0.txt" "--mess=false --config $CONFIG")"
else
  capture line "$M/if-this-node-lists-static-peers-update-the-list/2.txt"
  agent "$M/start-the-node/as-a-launchd-agent/0.txt" add "$line
<string>--mess=false</string>" "the line the static peers step printed, and --mess=false, added after --classic"
  start "$M/start-the-node/as-a-launchd-agent/1.txt"
fi
capture confirm "$M/confirm-the-move/0.txt"
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
  m=$(log_mark "$AGENT_LOG")
  paste "$M/if-you-need-to-roll-back/as-a-launchd-agent/0.txt"
  wait_gone test -S "$IPC"
  clean_since "$AGENT_LOG" "$m"
  agent "$M/if-you-need-to-roll-back/as-a-launchd-agent/1.txt" drop '<string>--mess=false<\/string>' \
    "--mess=false taken out, as the step asks"
  start "$M/if-you-need-to-roll-back/as-a-launchd-agent/2.txt"
fi
expect "$N" 'v1\.12\.20'
stop "$M/stop-the-node-cleanly/as-a-launchd-agent/0.txt"
expect "$M/install-the-release/$cpu/0.txt" 'Core-Geth 1\.13\.'
paste "$(renamed_again "$M/rename-the-old-p2p-node-key/0.txt")"
ci test -e "$KEYS/nodekey.old-rotated-$(date +%F)-2"
if [ "$way" = terminal ]; then
  start "$(with_flags "$M/start-the-node/in-a-terminal/0.txt" "--mess=false --config $CONFIG")"
else
  agent "$M/start-the-node/as-a-launchd-agent/0.txt" add '<string>--mess=false</string>' \
    "--mess=false added back after --classic"
  start "$M/start-the-node/as-a-launchd-agent/1.txt"
fi
capture confirm "$M/confirm-the-move/0.txt"
differ "the node ID" "$new" "$(enode_id "$confirm")"
holds "the node's name" "$confirm" 'v1\.13\.'

say "Once the node is stable, delete the v1.12 binary"
paste "$M/once-the-node-is-stable-delete-the-vx-binary/0.txt"
ci test ! -e /usr/local/bin/geth-v1.12
stop "$M/stop-the-node-cleanly/as-a-launchd-agent/0.txt"

say "Done: the discovery and migration guides' macOS tabs ran, $way on $cpu"
