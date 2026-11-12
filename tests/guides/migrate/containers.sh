#!/bin/bash
# The discovery and migration guides' Containers tabs on a v1.12.20 container, on a GitHub Linux runner:
#   mounted           the data in a volume: discovery's replacement container, then the move, a rollback, the
#                     move again and the old container's removal
#   inside            the data inside the container: the move with the data copied out, a rollback onto the
#                     copy, the move again from the copy and the old container's removal
#   discovery-inside  the data inside the container: discovery's copy and replacement container
# Usage: migrate/containers.sh mounted|inside|discovery-inside
set -e
. "$(dirname "$0")/../lib.sh"
. "$(dirname "$0")/v1.12.sh"

mode=${1:?mounted, inside or discovery-inside}
case $mode in
  mounted) data="-v core-geth-data:/root" way=in-a-volume-or-host-folder ;;
  inside | discovery-inside) data="" way=inside-the-container ;;
  *) echo "unknown mode: $mode"; exit 2 ;;
esac

cd "$HOME"
M=migrate/move-panel-containers
G=discovery/discovery-panel-containers
N=migrate/name-panel-containers/ask-the-running-node-for-its-name/0.txt
IPC=/root/.ethereum/classic/geth.ipc
OLD_IMAGE=etclabscore/core-geth:$OLD_RELEASE
MOUNTED=in-a-volume-or-host-folder

up() { wait_for "the container" docker exec core-geth test -S "$IPC"; }

# Where the container keeps its data: /root in a volume or host folder, nothing when it is inside.
where() {
  capture mounts "$1"
  if [ "$2" = "$MOUNTED" ]; then holds "the mounts" "$mounts" '/root'; else holds "the mounts" "$mounts" '^ *$'; fi
}

# The replacement's docker run with the static peers file mounted and --config and --mess=false after the
# image, as the steps' notes ask.
configured() {
  edited "$1" "with the static peers file mounted and --config /config.toml and --mess=false after the image, as the notes ask" \
    -e '/-p 30303:30303/a\  -v $HOME/core-geth-config.toml:/config.toml:ro \\' \
    -e '$ s|$| --config /config.toml --mess=false|'
}

# Docker Hub's v1.12.20 tag holds an Arm64 image only, so the workflow runs this on an Arm64 runner.
say "Scaffolding: a $OLD_IMAGE container, run the way the v1.12 line's guide ran one"
paste "$(scaffold "docker run -d --name core-geth --restart unless-stopped --stop-timeout 300 $data \
  -p 30303:30303 -p 30303:30303/udp -p 127.0.0.1:8545:8545 \
  $OLD_IMAGE --classic --http --http.addr 0.0.0.0 --http.port 8545")"
up
expect "$N" 'v1\.12\.20'

if [ "$mode" != inside ]; then
  say "Discovery: replace the container with one that reads the v1.13 line's lists and bootnodes"
  expect "$G/record-the-nodes-block-number-image-restart-policy-and-flags/0.txt" 'unless-stopped'
  where "$G/check-where-the-container-keeps-its-data/0.txt" "$way"
  expect "$G/stop-the-node-cleanly/0.txt" 'Blockchain stopped'
  if [ "$mode" = discovery-inside ]; then
    paste "$G/if-the-data-is-inside-the-container-copy-it-out/0.txt"
  else
    skip "$G/if-the-data-is-inside-the-container-copy-it-out/0.txt" "this container keeps its data in a volume"
  fi
  skip "$G/if-the-node-starts-from-a-config-file-update-it/0.txt" "the lines a config file holds; this node starts without one"
  paste "$G/replace-the-container-with-one-that-reads-the-vx-lines-lists-and-bootnodes/$way/0.txt"
  up
  expect "$G/confirm-the-node-holds-peers/0.txt" '^[0-9]+'
  paste "$G/once-it-holds-peers-remove-the-old-container/0.txt"
  if [ "$mode" = discovery-inside ]; then
    expect "$M/stop-the-node-cleanly/0.txt" 'Blockchain stopped'
    say "Done: the discovery guide's Containers tab ran, with the data copied out"
    exit 0
  fi
fi

say "Move: check the tools, pull, record, stop, rename the key, list static peers, replace, confirm"
expect "$M/check-docker-and-the-github-cli/0.txt" 'Logged in to github\.com'
skip "$M/check-docker-and-the-github-cli/1.txt" "signs in through a browser; the job's own token signs the GitHub CLI in"
expect "$M/pull-the-release/0.txt" 'Digest: sha256:'
capture record "$M/record-the-nodes-block-number-id-restart-policy-and-flags/0.txt"
old=$(enode_id "$record")
holds "the restart policy" "$record" 'unless-stopped'
where "$M/check-where-the-container-keeps-its-data/0.txt" "$way"
expect "$M/stop-the-node-cleanly/0.txt" 'Blockchain stopped'
paste "$M/rename-the-old-p2p-node-key/$way/0.txt"
skip "$M/if-this-node-lists-static-peers-update-the-list/0.txt" "the lines the file holds, which the next block writes"
paste "$M/if-this-node-lists-static-peers-update-the-list/1.txt"
peers_in "$HOME/core-geth-config.toml" "$old"
paste "$(configured "$M/replace-the-container/$way/0.txt")"
up
capture confirm "$M/confirm-the-move/0.txt"
new=$(enode_id "$confirm")
differ "the node ID" "$old" "$new"
holds "the release" "$confirm" 'Core-Geth 1\.13\.'
expect "$(with_ids "$M/if-other-nodes-list-this-node-give-them-the-new-id/0.txt" "$old" "$new")" 'true'

say "Roll back, then move again: the data is now in a volume or a host folder"
paste "$M/if-you-need-to-roll-back/$way/0.txt"
up
expect "$N" 'v1\.12\.20'
where "$M/check-where-the-container-keeps-its-data/0.txt" "$MOUNTED"
expect "$M/stop-the-node-cleanly/0.txt" 'Blockchain stopped'
paste "$(renamed_again "$M/rename-the-old-p2p-node-key/$MOUNTED/0.txt")"
paste "$(configured "$M/replace-the-container/$MOUNTED/0.txt")"
up
capture confirm "$M/confirm-the-move/0.txt"
differ "the node ID" "$new" "$(enode_id "$confirm")"
holds "the release" "$confirm" 'Core-Geth 1\.13\.'

say "Once the node is stable, remove the v1.12 container and image"
paste "$M/once-the-node-is-stable-remove-the-vx-container-and-image/0.txt"
ci test -z "$(docker ps -aq --filter name=core-geth-v1.12)"
expect "$M/stop-the-node-cleanly/0.txt" 'Blockchain stopped'

say "Done: the discovery and migration guides' Containers tabs ran, $mode"
