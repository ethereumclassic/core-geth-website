# The migration workflow's scaffolding for Linux and macOS, sourced after lib.sh: a v1.12.20 node, the release
# `etclabscore/core-geth` published last before the client moved to `ethereumclassic/core-geth`, installed
# where a reader on the v1.12 line keeps one. None of this is a guide step: it stands up the node the migration
# and discovery guides start from, and it retires with the migration workflow.

OLD_RELEASE=v1.12.20
OLD_BASE=https://github.com/etclabscore/core-geth/releases/download/$OLD_RELEASE
SCAFFOLDS=0

# Download the release for a platform token (linux, arm64, osx), check it and install it as /usr/local/bin/geth.
old_release() {
  say "Scaffolding: install $OLD_RELEASE, as a node on the v1.12 line has it"
  [ -n "$DRY" ] && return 0
  _zip=core-geth-$1-$OLD_RELEASE.zip
  mkdir -p "$WORK/old"
  (
    cd "$WORK/old"
    curl -fsSLO "$OLD_BASE/$_zip"
    curl -fsSLO "$OLD_BASE/$_zip.sha256"
    if command -v sha256sum > /dev/null; then sha256sum -c "$_zip.sha256"; else shasum -a 256 -c "$_zip.sha256"; fi
    unzip -o "$_zip"
    sudo mkdir -p /usr/local/bin
    sudo install -m 0755 geth /usr/local/bin/geth
  )
  if ! geth version | grep -q 'Core-Geth 1\.12\.20'; then
    echo "FAILED: $OLD_RELEASE is not the geth on PATH"
    exit 1
  fi
  echo "  $OLD_RELEASE installed at /usr/local/bin/geth"
}

# A block of CI's own, such as the scaffolding's start, written where the functions in lib.sh can run it.
scaffold() {
  SCAFFOLDS=$((SCAFFOLDS + 1))
  _s=$WORK/scaffold-$SCAFFOLDS.txt
  printf '%s\n' "$1" > "$_s"
  printf "CI's scaffolding, not a guide step" > "$_s.why"
  printf '%s' "$_s"
}

# The edit a static peers step's note asks for, a real entry in place of the example: this node's own old ID at
# an address nothing listens on, which the client accepts and never reaches. peers_in <file> <enode> [sudo]
peers_in() {
  [ -n "$DRY" ] && return 0
  echo "  ci: the note's edit, an entry in place of the example, in $1"
  ${3:-} sed -i.bak "s|enode://<node ID>@<IP>:30303|$2@127.0.0.1:30399|" "$1"
  ${3:-} cat "$1"
}

# A copy of the "give them the new ID" block with this node's IDs in place of the placeholders, run against
# this node itself, which stands in for the nodes that list it.
with_ids() {
  edited "$1" "with this node's old and new IDs and 127.0.0.1 in place of the placeholders" \
    -e "s|<old ID>|${2#enode://}|; s|<new ID>|${3#enode://}|; s|@<IP>:|@127.0.0.1:|g"
}

# A copy of a rename block with -2 after the date, as the rollback note asks of a second rename on one day.
renamed_again() {
  edited "$1" "with -2 after the date, as the rollback note asks of a second rename on the same day" \
    -e 's/\$(date +%F)/$(date +%F)-2/'
}

# Require a value to match an extended regular expression.
holds() {
  [ -n "$DRY" ] && return 0
  if ! printf '%s\n' "$2" | grep -Eq -- "$3"; then
    echo "FAILED: $1 did not match /$3/"
    exit 1
  fi
  echo "  $1 matches /$3/"
}
