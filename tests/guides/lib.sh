# The guide workflows' runner for Linux and macOS, sourced by bash and by zsh alike. Each block runs as one
# paste into this one shell, so a directory or a variable a block sets carries to the next block, as it does
# in a reader's terminal. A block stops at its first failing line, which is stricter than a paste.
#
# A scenario names each block by its path in the bundle `tests/guides/blocks.py` writes, so a step renamed on
# the page fails the run instead of being skipped. A step that waits for a person, such as a password prompt
# or an editor, is shown and skipped with its reason; where a note asks the reader to change a block, CI runs
# a copy changed the way the note says, and prints what changed.
#
# With DRY=1 nothing runs: each function only checks that its block is on the page, so every path a scenario
# names can be checked against a build without a node, a network or the system the scenario is for.

: "${BUNDLE:?set BUNDLE to the directory tests/guides/blocks.py wrote}"
DRY=${DRY:-}
WORK=$(mktemp -d)
NODE_LOG=$WORK/node.log
NODE_PID=

say() { printf '\n== %s\n' "$*"; }

# A block's file: a path in the bundle, or a copy one of the functions below wrote.
src() { case $1 in /*) printf '%s' "$1" ;; *) printf '%s' "$BUNDLE/$1" ;; esac; }

need() {
  if [ ! -f "$(src "$1")" ]; then
    echo "MISSING BLOCK: $1 is not on the built page"
    exit 2
  fi
}

show() {
  need "$1"
  printf -- '--- %s\n' "${1#"$WORK"/}"
  if [ -f "$1.why" ]; then printf '    (%s)\n' "$(cat "$1.why")"; fi
  sed 's/^/  | /' "$(src "$1")"
}

# Run a block in this shell.
paste() {
  show "$1"
  [ -n "$DRY" ] && return 0
  set -e
  . "$(src "$1")"
}

# Run a block in a subshell and require its output to match an extended regular expression.
expect() {
  show "$1"
  [ -n "$DRY" ] && return 0
  _out=$( (set -e; . "$(src "$1")") 2>&1) || { printf '%s\n' "$_out"; echo "FAILED: $1"; exit 1; }
  printf '%s\n' "$_out"
  if ! printf '%s\n' "$_out" | grep -Eq -- "$2"; then
    echo "FAILED: $1 did not print /$2/"
    exit 1
  fi
}

# Run a block in a subshell and keep its output in the variable named first.
capture() {
  show "$2"
  if [ -n "$DRY" ]; then
    eval "$1=dry-run"
    return 0
  fi
  _out=$( (set -e; . "$(src "$2")") 2>&1) || { printf '%s\n' "$_out"; echo "FAILED: $2"; exit 1; }
  printf '%s\n' "$_out"
  eval "$1=\$_out"
}

skip() {
  show "$1"
  echo "SKIPPED: $2"
}

# A copy of a block changed the way its note asks: edited <block> <what the note asks> <sed arguments...>
edited() {
  need "$1"
  _e=$WORK/${1#"$WORK"/}.edited
  mkdir -p "$(dirname "$_e")"
  _from=$1 _why=$2
  shift 2
  sed "$@" "$(src "$_from")" > "$_e"
  printf '%s' "$_why" > "$_e.why"
  printf '%s' "$_e"
}

# A copy of a block with flags added to its last line, as a note asks: with_flags <block> <flags>
with_flags() {
  need "$1"
  _e=$WORK/${1#"$WORK"/}.flags
  mkdir -p "$(dirname "$_e")"
  awk -v add="$2" '{ l[NR] = $0 } END { for (i = 1; i < NR; i++) print l[i]; print l[NR] " " add }' \
    "$(src "$1")" > "$_e"
  printf 'with %s added, as its note asks' "$2" > "$_e.why"
  printf '%s' "$_e"
}

# A block that runs in a terminal of its own, such as `docker run -it`: a copy that runs it under `script`.
in_terminal() {
  need "$1"
  _e=$WORK/${1#"$WORK"/}.tty
  mkdir -p "$(dirname "$_e")"
  printf 'script -qefc %s /dev/null\n' "'bash $(src "$1")'" > "$_e"
  printf 'run in a terminal of its own, as a reader runs it' > "$_e.why"
  printf '%s' "$_e"
}

# Start a block in the background, in a process group of its own as a terminal runs it, output in NODE_LOG.
background() {
  if [ -n "${ZSH_VERSION:-}" ]; then
    # zsh refuses job control without a terminal, so perl makes the group, with SIGINT at its default.
    perl -e '$SIG{INT} = "DEFAULT"; setpgrp(0, 0); exec @ARGV or die "exec: $!"' \
      zsh -c '. "$1"' zsh "$(src "$1")" > "$NODE_LOG" 2>&1 &
    NODE_PID=$!
  else
    set -m
    ( . "$(src "$1")" ) > "$NODE_LOG" 2>&1 &
    NODE_PID=$!
    set +m
  fi
}

# Start a node block in the background and wait until the command after it succeeds:
# start_node <block> <readiness command...>
start_node() {
  show "$1"
  [ -n "$DRY" ] && return 0
  : > "$NODE_LOG"
  background "$1"
  shift
  wait_for "the node" "$@"
}

# Wait up to 240 seconds for a command to succeed, failing early if the node in the background exits.
wait_for() {
  [ -n "$DRY" ] && return 0
  _what=$1
  shift
  _i=0
  while ! "$@" > /dev/null 2>&1; do
    if [ -n "$NODE_PID" ] && ! kill -0 "$NODE_PID" 2> /dev/null; then
      echo "FAILED: $_what exited before \`$*\` succeeded"
      tail -40 "$NODE_LOG"
      exit 1
    fi
    _i=$((_i + 1))
    if [ "$_i" -ge 240 ]; then
      echo "FAILED: \`$*\` did not succeed within 240s"
      [ -f "$NODE_LOG" ] && tail -40 "$NODE_LOG"
      exit 1
    fi
    sleep 1
  done
  echo "  ready after ${_i}s: $*"
}

# Wait up to 300 seconds for a command to fail, such as a node's IPC socket test once it is told to stop.
wait_gone() {
  [ -n "$DRY" ] && return 0
  _i=0
  while "$@" > /dev/null 2>&1; do
    _i=$((_i + 1))
    if [ "$_i" -ge 300 ]; then
      echo "FAILED: \`$*\` still succeeded after 300s"
      exit 1
    fi
    sleep 1
  done
  echo "  gone after ${_i}s: $*"
}

# Press Ctrl-C once in the node's terminal, or run the command given in its place, then wait for the
# background block to exit and check that the node stopped cleanly.
stop_node() {
  if [ -n "$DRY" ]; then
    case ${1:-} in paste | expect) "$@" ;; esac
    return 0
  fi
  _mark=$(log_mark "$NODE_LOG")
  if [ $# -gt 0 ]; then
    "$@"
  else
    # A node run through sudo belongs to another user: the terminal signals it without asking, CI through sudo.
    kill -INT -- "-$NODE_PID" 2> /dev/null || sudo kill -INT -- "-$NODE_PID"
  fi
  _i=0
  while kill -0 "$NODE_PID" 2> /dev/null; do
    sleep 1
    _i=$((_i + 1))
    if [ "$_i" -ge 300 ]; then
      echo "FAILED: the node did not stop within 300s"
      exit 1
    fi
  done
  wait "$NODE_PID" 2> /dev/null || true
  NODE_PID=
  echo "  stopped after ${_i}s"
  clean_since "$NODE_LOG" "$_mark"
}

# Check that a node's log records a clean stop.
clean_in() {
  [ -n "$DRY" ] && return 0
  if ! grep -q 'Blockchain stopped' "$1"; then
    echo "FAILED: $1 does not record a clean stop"
    tail -30 "$1"
    exit 1
  fi
  echo "  the log records a clean stop"
}

# A log's length now, so that clean_since checks only what a later stop writes to it.
log_mark() {
  if [ -f "$1" ]; then wc -l < "$1" | tr -d ' '; else echo 0; fi
}

# A node closes its IPC endpoint first and logs `Blockchain stopped` last, and a service manager can return
# before it is done, so these wait up to 300 seconds for the line.
clean_since() {
  [ -n "$DRY" ] && return 0
  _i=0
  until tail -n "+$(($2 + 1))" "$1" 2> /dev/null | grep -q 'Blockchain stopped' || [ "$_i" -ge 300 ]; do
    sleep 1
    _i=$((_i + 1))
  done
  tail -n "+$(($2 + 1))" "$1" > "$WORK/since.log"
  clean_in "$WORK/since.log"
}

# The systemd service's journal since a time from `date +%s`, checked for a clean stop.
journal_since() {
  [ -n "$DRY" ] && return 0
  _i=0
  until sudo journalctl -u core-geth --no-pager --since "@$1" | grep -q 'Blockchain stopped' || [ "$_i" -ge 300 ]; do
    sleep 1
    _i=$((_i + 1))
  done
  sudo journalctl -u core-geth --no-pager --since "@$1" > "$WORK/journal.log"
  clean_in "$WORK/journal.log"
}

# A check of CI's own, not a guide step: printed, and left out of a dry run.
ci() {
  [ -n "$DRY" ] && return 0
  printf '  ci: %s\n' "$*"
  "$@"
}

# A block that follows a log until Ctrl-C: run it for a while, then stop following.
follow() {
  show "$1"
  [ -n "$DRY" ] && return 0
  if [ -n "${ZSH_VERSION:-}" ]; then
    ( . "$(src "$1")" ) &
    _f=$!
    sleep "${2:-10}"
    pkill -TERM -P "$_f" 2> /dev/null || true
    kill -TERM "$_f" 2> /dev/null || true
  else
    set -m
    ( . "$(src "$1")" ) &
    _f=$!
    set +m
    sleep "${2:-10}"
    kill -TERM -- "-$_f" 2> /dev/null || sudo kill -TERM -- "-$_f" 2> /dev/null || true
  fi
  wait "$_f" 2> /dev/null || true
}

# Require two values to differ, such as a node's ID before and after its key is renamed.
differ() {
  [ -n "$DRY" ] && return 0
  if [ -z "$2" ] || [ "$2" = "$3" ]; then
    echo "FAILED: $1 did not change ($2)"
    exit 1
  fi
  echo "  $1 changed: $2 -> $3"
}

# The enode ID in a block's output, without its address.
enode_id() {
  printf '%s\n' "$1" | grep -Eo 'enode://[0-9a-f]{128}' | head -1
}

# A node left running when a scenario stops early is stopped with it.
trap '[ -z "$NODE_PID" ] || kill -INT -- "-$NODE_PID" 2> /dev/null || true' EXIT
