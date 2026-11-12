# Guide workflows

Two workflows run the commands the guide pages show, as a reader copies them, on the systems the guides'
tabs name:

- **`guides-install.yml`** runs the install guide for the `v1.13` line, and the discovery guide's start
  from the committed node records, which serves a node on either line.
- **`guides-migration.yml`** stands up a `v1.12.20` node, the last release `etclabscore/core-geth`
  published, runs the discovery guide's steps on it, then the migration guide's: the move, a rollback,
  the move again, and the removal of the `v1.12` binary or container. Retire it, with `migrate/`, once
  the network is past the `v1.12` line.

Both run only by hand, when a guide changes: from the repository's Actions tab, or with
`gh workflow run guides-install.yml --ref <branch>`. Neither deploys anything.

## How a run works

1. The `bundle` job builds the site, then `blocks.py` writes every command block on the guide pages to a
   file, exactly as its copy button copies it, and `urls.py` checks that every web address in a block
   answers.
2. Each job runs a scenario that names the blocks it runs by path:
   `<page>/<panel id>/<step>/<n>.txt`, or `<page>/<panel id>/<step>/<way>/<n>.txt` for a block inside one
   of a step's tabs. The step and the way are their titles in lowercase, with a version number written
   as `x`. A step renamed or removed on the page stops the run with `MISSING BLOCK`.
3. Blocks run in the shell a reader uses: bash on Linux, zsh on macOS and Windows PowerShell 5.1 on
   Windows. Each block runs as one paste into the same session, so a folder or a variable one block
   sets reaches the next, and it stops at its first failing line, which is stricter than a paste.
4. A node start runs in the background, or on Windows in a window of its own. The run waits for the
   node's IPC endpoint, runs the guide's checks against it, stops it the way the guide does, Ctrl-C or
   the service's stop command, and requires `Blockchain stopped` in what the node printed.

| Workflow  | Job                                  | Where                                                                                                                       |
| --------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| install   | Linux tab, terminal and source build | a fresh Debian 13, Ubuntu 24.04, Fedora, Rocky Linux 9 and Arch container                                                   |
| install   | Linux tab, systemd service           | GitHub's Ubuntu runners, x86-64 and Arm64                                                                                   |
| install   | Containers tab, with the image files | GitHub's Ubuntu runners, x86-64 and Arm64                                                                                   |
| install   | macOS tab and source build           | GitHub's macOS runners, Apple Silicon and Intel                                                                             |
| install   | Windows tab and source build         | GitHub's Windows Server runner                                                                                              |
| migration | Linux tab, terminal                  | a fresh Debian 13 container                                                                                                 |
| migration | Linux tab, systemd service           | GitHub's Ubuntu runner                                                                                                      |
| migration | Containers tab                       | GitHub's Ubuntu runner: data in a volume, data inside the container, and discovery with the data copied out                 |
| migration | macOS tab                            | Intel in a terminal and as a launchd agent; Apple Silicon in a terminal, running the `v1.12.20` Intel build through Rosetta |
| migration | Windows tab                          | in a PowerShell window, and from the Startup folder                                                                         |

## What a run does not do

- **It does not judge the client.** It checks that each command does what its step says: a file checks,
  a node starts, answers and stops cleanly, a key rename gives the node a new ID. Sync, peers, MESS and
  what a key rotation protects belong to `ethereumclassic/core-geth`'s own tests.
- **A step that waits for a person is shown and skipped, with the reason printed:** `su`'s root password,
  `gh auth login`'s browser sign-in, a block that opens an editor. Where a step's text asks the reader
  to change a block or a file, the run makes that change, prints what it changed, and runs the result.
- **A block that is a file's contents, not a command**, such as the TOML lines a config file holds, is
  shown and skipped; the block that writes the file runs.
- **A step meant for another node operator's machine** runs against the node under test, with that
  node's own IDs in place of the placeholders.
- **The job's own token signs the GitHub CLI in**, through `GH_TOKEN`.
- **Arm v5, v6 and v7 have no runner.** Their archives' addresses are checked with every other address.

## Running a scenario locally

A dry run checks every block path a scenario names against a build, and runs nothing:

```bash
pnpm build
python3 tests/guides/blocks.py dist /tmp/bundle
DRY=1 BUNDLE=/tmp/bundle bash tests/guides/install/linux.sh debian
```

A Linux scenario runs for real in a throwaway container, which `in-container.sh` removes when the
scenario ends:

```bash
BUNDLE=/tmp/bundle bash tests/guides/in-container.sh debian:13 install/linux.sh debian
```

## Writing a scenario

`lib.sh` is the runner for bash and zsh, `lib.ps1` for Windows PowerShell. A scenario names each block
it runs, in the guide's order, with the function that says how:

| bash and zsh              | PowerShell                | Use                                                 |
| ------------------------- | ------------------------- | --------------------------------------------------- |
| `paste`                   | `Invoke-Block`            | run a block                                         |
| `expect`                  | `Expect-Block`            | run a block and require a pattern in what it prints |
| `capture`                 | `Invoke-Block`            | run a block and keep what it prints                 |
| `start_node`, `stop_node` | `Start-Node`, `Stop-Node` | run a node block, then stop it as the guide does    |
| `skip`                    | `Skip-Block`              | show a block and say why it does not run            |
| `edited`, `with_flags`    | `New-Copy`, `Add-Flags`   | run a copy changed the way a step's text asks       |

A check of the run's own, which is not a guide step, goes through `ci` on bash and zsh, so a dry run
leaves it out.
