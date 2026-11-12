#!/bin/zsh
# The install guide's macOS tab, in zsh, the shell a Mac opens: the release, a node in a terminal and as the
# launchd agent, each started, checked, updated and stopped, the Verify tab, and the dark band, with jq from
# Homebrew and from jq's own build.
# Usage: install/macos.sh apple-silicon|intel
set -e
. "$(dirname "$0")/../lib.sh"

cpu=${1:?apple-silicon or intel}
case $cpu in
  apple-silicon) jq_way=apple-silicon-mac jq_file=jq-macos-arm64 ;;
  intel) jq_way=intel-mac jq_file=jq-macos-amd64 ;;
  *) echo "unknown processor: $cpu"; exit 2 ;;
esac

cd "$HOME"
I=install/panel-macos
V=install/verify-panel-macos
D=discovery/dark-panel-macos
A=$I/start-a-node-on-ethereum-classic/as-a-launchd-agent
U=$I/when-a-new-release-ships-update-the-node/as-a-launchd-agent
IPC=$HOME/Library/Ethereum/classic/geth.ipc
AGENT_LOG=$HOME/Library/Logs/core-geth-classic.log
ARCHIVE=$I/download-the-release-check-it-and-install-it/$cpu/0.txt

say "Download the release, check it and install it"
expect "$ARCHIVE" 'Core-Geth 1\.13\.'

say "Start a node in a terminal, check it from a second one, and stop it with Ctrl-C"
start_node "$I/start-a-node-on-ethereum-classic/in-a-terminal/0.txt" test -S "$IPC"
expect "$I/check-that-it-syncs/0.txt" 'false|currentBlock'
stop_node

say "Update in a terminal"
expect "$ARCHIVE" 'Core-Geth 1\.13\.'
start_node "$I/when-a-new-release-ships-update-the-node/in-a-terminal/0.txt" test -S "$IPC"
stop_node

say "Set up the launchd agent and start it"
paste "$A/0.txt"
ci plutil -lint "$HOME/Library/LaunchAgents/com.coregeth.classic.plist"
paste "$A/1.txt"
follow "$A/2.txt" 20
wait_for "the agent" test -S "$IPC"
expect "$I/check-that-it-syncs/0.txt" 'false|currentBlock'

say "Update the agent's node: stop it, install the release again, start it"
m=$(log_mark "$AGENT_LOG")
paste "$U/0.txt"
wait_gone test -S "$IPC"
clean_since "$AGENT_LOG" "$m"
expect "$ARCHIVE" 'Core-Geth 1\.13\.'
paste "$U/1.txt"
wait_for "the agent" test -S "$IPC"

say "Verify the archive"
paste "$V/install-or-update-the-github-cli/homebrew/0.txt"
if [ -n "${GH_TOKEN:-}" ] || [ -n "$DRY" ]; then
  expect "$V/check-the-github-cli/0.txt" 'Logged in to github\.com'
  skip "$V/check-the-github-cli/1.txt" "signs in through a browser; the job's own token signs the GitHub CLI in"
  expect "$V/check-an-archive/$cpu/0.txt" 'Verification succeeded'
fi

say "Dark band: stop the agent's node, get jq both ways, start once from the committed records"
m=$(log_mark "$AGENT_LOG")
follow "$D/stop-the-node-cleanly/as-a-launchd-agent/0.txt" 30
wait_gone test -S "$IPC"
clean_since "$AGENT_LOG" "$m"
expect "$D/check-that-curl-and-jq-are-installed/0.txt" 'jq-1\.'
paste "$D/check-that-curl-and-jq-are-installed/mac-with-homebrew/0.txt"
paste "$D/check-that-curl-and-jq-are-installed/$jq_way/0.txt"
ci /usr/local/bin/jq --version
ci test ! -e "$HOME/$jq_file"
start_node "$D/start-the-node-once-from-the-committed-records/0.txt" test -S "$IPC"
expect "$D/check-that-it-holds-peers-then-start-it-the-usual-way/0.txt" '^[0-9]+$'
stop_node
paste "$D/check-that-it-holds-peers-then-start-it-the-usual-way/as-a-launchd-agent/0.txt"
wait_for "the agent" test -S "$IPC"

say "Stop the agent"
m=$(log_mark "$AGENT_LOG")
paste "$U/0.txt"
wait_gone test -S "$IPC"
clean_since "$AGENT_LOG" "$m"

say "Done: the install guide's macOS tab ran on $cpu"
