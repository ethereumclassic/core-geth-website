#!/bin/bash
# Run a guide scenario in a fresh container of a Linux distribution, as a user with passwordless sudo, the
# way a reader's server account runs the guide. The user and its sudo are CI's setup, not a guide step: the
# guide's own first step checks sudo, and the step that sets it up asks for a root password CI cannot type.
# Empty lines on standard input answer the prompts a reader answers with Enter, such as pacman's.
# Usage: tests/guides/in-container.sh <image> <scenario under tests/guides> [arguments]
set -euo pipefail
image=$1
shift
tests=$(cd "$(dirname "$0")/.." && pwd)
: "${BUNDLE:?set BUNDLE to the directory tests/guides/blocks.py wrote}"

docker run --rm -e GH_TOKEN -v "$tests:/tests:ro" -v "$BUNDLE:/bundle:ro" "$image" bash -c '
  set -e
  if command -v apt-get >/dev/null; then
    apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq sudo >/dev/null
  elif command -v dnf >/dev/null; then
    dnf install -y -q sudo >/dev/null
  elif command -v pacman >/dev/null; then
    pacman -Syu --noconfirm --needed sudo >/dev/null
  fi
  useradd -m reader
  echo "reader ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/reader
  chmod 0440 /etc/sudoers.d/reader
  scenario=$1
  shift
  yes "" | sudo -u reader -H env BUNDLE=/bundle GH_TOKEN="${GH_TOKEN:-}" bash "/tests/guides/$scenario" "$@"
' bash "$@"
