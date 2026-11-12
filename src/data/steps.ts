/**
 * Every install, move and verify step on /downloads/, and in the guides that walk through the same
 * steps: each command is written here once. The panels read the latest release, its files and the
 * Go release `main` pins at build time, so a page that renders them needs no reads of its own.
 */
import type { PanelStep, PlatformPanel, StepVariant } from "@/components/PlatformTabs.astro";
import { getDiscovery, type NetworkDiscovery } from "@/data/discovery";
import { getDownloads } from "@/data/release-assets";
import { getRepository } from "@/data/repository";
import { getGoToolchain, type GoFile } from "@/data/toolchain";
import {
  BELOW_FLOOR_POINTER,
  DARK_LISTS,
  DOCS,
  DOCS_URL,
  EXPOSED_LINE,
  GUIDE_PAGES,
  INSTALL_ANCHOR,
  LISTS_REPO,
  MOVE_RECOMMENDATION,
  RECOMMENDED_LINE,
  REPO,
  UPGRADE_COST,
} from "@/data/site";

// Every file the latest release published, read from GitHub at build time rather than
// listed by hand, behind one tab per platform.
export const downloads = await getDownloads();

// Every command that names a release names a real one, even when the API cannot be reached:
// the asset list comes from the release, and the tag falls back to the repository snapshot. A
// build that lost the API still publishes commands a reader can run; only the file table, which
// cannot be known without the API, degrades.
//
// Use `latest` where it is an option (maintainer, 2026-11-02). An image tag can say it, so the
// containers blocks do. A file name cannot, because every asset of a release carries the tag, so
// archive and image-file commands name the last release. Every build from source clones `main`
// (maintainer, 2026-11-04), which takes the patches and dependency updates reviewed into it before a
// release ships them, and the page offers no tagged clone.
const facts = await getRepository();
const releaseTag = downloads?.tag ?? facts.release.tag;

// The line as `geth version` prints it, which carries no `v`.
const LINE_VERSION = RECOMMENDED_LINE.replace(/^v/, "");

// The notes below tell a reader to stop unless a command reports the recommended line, so the
// release this build read has to be on that line.
if (!releaseTag.startsWith(`${RECOMMENDED_LINE}.`)) {
  throw new Error(`the latest release, ${releaseTag}, is outside ${RECOMMENDED_LINE}`);
}

const assetBase = `https://github.com/${REPO.slug}/releases/download/${releaseTag}`;

// A step that runs differently for some readers carries each way as a tab of its own, with its own
// blocks (maintainer, 2026-11-12): a command for another distribution, processor or way of running the
// node, where a note used to name it. A one-word swap, such as `--mordor` for `--classic`, stays in the
// note. Each label names what a reader recognizes about their own machine.
export const IN_TERMINAL = "In a terminal";
const SYSTEMD = "As a systemd service";
const LAUNCHD = "As a launchd agent";
const IN_WINDOW = "In a PowerShell window";
const STARTUP = "From the Startup folder";
const RUNS = "Choose how the node runs";
const DISTRO = "Choose your distribution";
const CPU = "Choose your processor";

const distros = (
  debian: string,
  fedora: string,
  arch: string,
  archNote = "",
  fedoraNote = "",
): StepVariant[] => [
  { label: "Debian or Ubuntu", code: debian },
  { label: "Fedora or RHEL", code: fedora, ...(fedoraNote ? { after: fedoraNote } : {}) },
  { label: "Arch", code: arch, ...(archNote ? { after: archNote } : {}) },
];

const archFull = "`-Syu` brings the rest of the system current with them, as Arch requires.";

// RHEL 9's smaller installs carry `curl-minimal`, beside which dnf refuses to install `curl`.
// `--allowerasing` lets dnf replace it, and changes nothing where `curl` is the package installed, as on Fedora.
const dnfWithCurl = (tools: string) =>
  `sudo dnf install -y --refresh --allowerasing ${tools} && sudo dnf upgrade -y ${tools}`;
const curlMinimal =
  "A smaller RHEL install carries `curl-minimal`, which dnf will not install `curl` beside: `--allowerasing` lets it replace that package.";

// The archives a release publishes for each processor, by the token in the file name and the label the
// release file table gives it. `uname -m` names the processor.
const LINUX_CPUS = [
  { label: "x86-64", token: "linux" },
  { label: "Arm64", token: "arm64" },
  { label: "Arm v7", token: "arm7" },
  { label: "Arm v6", token: "arm6" },
  { label: "Arm v5", token: "arm5" },
] as const;

const MAC_CPUS = [
  { label: "Apple Silicon", token: "osx-arm64" },
  { label: "Intel", token: "osx" },
] as const;

const IMAGE_CPUS = [
  { label: "x86-64", token: "docker-amd64" },
  { label: "Arm64", token: "docker-arm64" },
] as const;

// A host checks an image file with its own tool: Linux with `sha256sum`, macOS with `shasum`, as the macOS tabs do.
const IMAGE_HOSTS = [
  { label: "x86-64 Linux", token: "docker-amd64", sum: "sha256sum -c" },
  { label: "Arm64 Linux", token: "docker-arm64", sum: "sha256sum -c" },
  { label: "Apple Silicon Mac", token: "docker-arm64", sum: "shasum -a 256 -c" },
  { label: "Intel Mac", token: "docker-amd64", sum: "shasum -a 256 -c" },
] as const;

const linuxUname =
  "`uname -m` names the processor: `x86_64` is x86-64, `aarch64` or `arm64` is Arm64, and `armv7l`, `armv6l` and `armv5tel` are Arm v7, v6 and v5.";

const macUname = "`uname -m` prints `arm64` on Apple Silicon and `x86_64` on Intel.";

const sameCpu = "Choose the processor you downloaded the release for:";

// Where the documentation's run guides keep a node running, which the install tabs' service tabs follow.
const RUN_LINUX = `${DOCS_URL}getting-started/run/linux/#6-keep-it-running-a-systemd-service`;
const RUN_MACOS = `${DOCS_URL}getting-started/run/macos/#6-keep-it-running-a-launchd-agent`;
const RUN_WINDOWS = `${DOCS_URL}getting-started/run/windows/#6-keep-it-running-start-it-when-you-sign-in`;

const releaseNotes = `Read the release's notes on [the releases page](${REPO.releasesUrl}) first.`;

const attestationMust = (workflow: string, action = "run the file") =>
  `\`gh attestation verify\` must print \`Verification succeeded\` and name \`.github/workflows/${workflow}\`. If it does not, do not ${action}.`;

// The tools a block needs get a step of their own before it: a block that checks each one, and a note
// saying what each line must print and where to get the tool (maintainer, 2026-11-05). A missing or old
// tool then shows as one line's error, not as a build or a check that fails partway. Each check is a line of
// its own, so one missing tool cannot hide another.

// Windows gives a changed PATH only to windows opened after the change. This line reads it back from Windows'
// settings, machine entries first as a new window would get them, so the window in use finds what was just
// installed.
const windowsPathReload =
  '$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")';

// `gh attestation` arrived in the GitHub CLI's 2.49.0 release (its release notes, 2024-04-30), and the
// installation guide says verifying needs the CLI signed in. Debian's and Ubuntu's own `gh` packages are
// older than that (2.23.0 to 2.46.0 across Debian 12 and 13 and Ubuntu 24.04 and 26.04, read 2026-11-05),
// so a reader there takes GitHub's own package. Every install line ends at the tool's current release
// (maintainer, 2026-11-05): WinGet's and Homebrew's `install` also update an older copy. `docker version` in
// this format prints the engine's version, and an error when no engine answers.
const ghTools = `gh --version
gh auth status`;

const ghCheck =
  "`gh --version` must print 2.49.0 or later, the release that added `gh attestation`. `gh auth status` must say you are logged in to github.com.";

const ghLogin = {
  before: "If `gh auth status` does not say you are logged in, sign in:",
  code: "gh auth login",
};

const ghNeed = "Checking where a file came from needs the GitHub CLI, signed in to GitHub.";

// GitHub's own commands for its Linux packages, from `docs/install_linux.md` in `cli/cli` (read at e87ed4c75191,
// 2026-10-23). The Debian block is GitHub's, in this site's indentation. The DNF lines are chained and take `-y`,
// so a pasted line cannot fall to a `[y/N]` prompt as its answer, and end with an upgrade, so an older `gh` moves
// to the current release. DNF5 adds the repository once and DNF4 rewrites it, so a second run updates `gh`.
const GH_DEBIAN = `(type -p wget >/dev/null || (sudo apt update && sudo apt install wget -y)) \\
  && sudo mkdir -p -m 755 /etc/apt/keyrings \\
  && out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg \\
  && cat $out | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \\
  && sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \\
  && sudo mkdir -p -m 755 /etc/apt/sources.list.d \\
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \\
  && sudo apt update \\
  && sudo apt install gh -y`;

const GH_FEDORA = `sudo dnf install -y dnf5-plugins &&
  { test -e /etc/yum.repos.d/gh-cli.repo || sudo dnf config-manager addrepo --from-repofile=https://cli.github.com/packages/rpm/gh-cli.repo; } &&
  sudo dnf install -y gh &&
  sudo dnf upgrade -y gh`;

const GH_RHEL = `sudo dnf install -y 'dnf-command(config-manager)' &&
  sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo &&
  sudo dnf install -y gh &&
  sudo dnf upgrade -y gh`;

// Each verify tab installs or updates the GitHub CLI the way its platform does, then checks it.
const ghSteps = (platform: "linux" | "macos" | "windows"): PanelStep[] => {
  const check = {
    title: "Check the GitHub CLI",
    code: ghTools,
    after: `${ghCheck} The checksum line in the next step does not need the GitHub CLI.`,
    more: [ghLogin],
  };
  if (platform === "windows") {
    return [
      {
        title: "Install or update the GitHub CLI",
        before: `${ghNeed} In PowerShell, WinGet, which comes with Windows 11, installs it, or updates an older one:`,
        code: "winget install --id GitHub.cli -e --source winget --accept-source-agreements --accept-package-agreements",
        after: "Approve the prompt the installer shows.",
      },
      {
        ...check,
        before: "In the same window:",
        code: `${windowsPathReload}
${ghTools}`,
        after: `The first line reloads \`PATH\` from Windows' settings, so this window finds \`gh\`. ${check.after}`,
      },
    ];
  }
  if (platform === "macos") {
    return [
      {
        title: "Install or update the GitHub CLI",
        before: ghNeed,
        choose: "Choose how to install the GitHub CLI",
        variants: [
          {
            label: "Homebrew",
            code: "brew install gh",
            after: "This installs it, or updates an older one.",
          },
          {
            label: "GitHub's installer",
            before:
              "Download the macOS installer from [GitHub's releases](https://github.com/cli/cli/releases/latest), open it, and follow its steps.",
          },
        ],
      },
      { ...check, before: "Then confirm the release and the sign-in:" },
    ];
  }
  return [
    {
      title: "Install or update the GitHub CLI",
      before: `${ghNeed} Debian's and Ubuntu's own \`gh\` packages are older than 2.49.0, so these lines take GitHub's own package, from GitHub's [Installing gh on Linux](https://github.com/cli/cli/blob/trunk/docs/install_linux.md):`,
      choose: DISTRO,
      variants: [
        { label: "Debian or Ubuntu", code: GH_DEBIAN },
        { label: "Fedora", code: GH_FEDORA },
        { label: "RHEL or CentOS", code: GH_RHEL },
        {
          label: "Arch",
          code: "sudo pacman -Syu --needed github-cli",
          after: "`-Syu` brings the rest of the system current with it, as Arch requires.",
        },
      ],
      then: "Each one installs the GitHub CLI, or updates an older one. The Fedora tab is GitHub's DNF5 commands and the RHEL tab its DNF4 commands: `dnf --version` says which a machine has. Confirm a signing key the package manager asks about against the fingerprints at the top of GitHub's guide.",
    },
    { ...check, before: "Then confirm the release and the sign-in:" },
  ];
};

const containerTools = `docker version --format '{{.Server.Version}}'
${ghTools}`;

// The Containers tabs' commands use a POSIX shell's line continuations, `$(...)` and `grep`, so on Windows they
// run in WSL, where Docker Desktop's integration gives the same `docker` commands.
const posixShell =
  "These commands run in a Linux or macOS shell: on Windows, run them in a WSL terminal, with Docker Desktop's [WSL integration](https://docs.docker.com/desktop/features/wsl/) turned on.";

// On Linux, a user outside the `docker` group gets `permission denied` from the engine's socket.
const containerStep = (uses: string, kept = "") => ({
  title: "Check Docker and the GitHub CLI",
  before: `${posixShell} They need Docker to ${uses}, and the GitHub CLI to check where the image came from:`,
  code: containerTools,
  after: `${kept}The first line must print the Docker engine's version. An error in its place means Docker is not installed or not running: [Get Docker](https://docs.docker.com/get-started/get-docker/) says how to install it. On Linux, an error that says \`permission denied\` means your user cannot reach the engine: run the \`docker\` commands with \`sudo\`, or add your user to the \`docker\` group as Docker's [Linux post-installation steps](https://docs.docker.com/engine/install/linux-postinstall/) show, which also say why that group is as powerful as root. ${ghCheck} Install or update the GitHub CLI from [cli.github.com](https://cli.github.com/). On Debian and Ubuntu, take GitHub's own package: theirs are older than 2.49.0.`,
  more: [ghLogin],
});

// The Linux archive steps download with `curl` and unpack with `unzip`, which a minimal server install can
// lack. Each line ends at the distribution's current release: `apt-get install` also upgrades, DNF5's
// `install` leaves an installed package as it is, so Fedora's line upgrades as well, and Arch takes the full
// `-Syu` it requires.
const linuxFetchTools = (lead = ""): PanelStep => ({
  title: "Install curl and unzip",
  before: `${lead}The steps download with curl and unpack with unzip, which a minimal server install can lack:`,
  choose: DISTRO,
  variants: distros(
    "sudo apt-get update && sudo apt-get install -y curl unzip",
    dnfWithCurl("curl unzip"),
    "sudo pacman -Syu --needed curl unzip",
    archFull,
    curlMinimal,
  ),
  then: "Each line also updates curl and unzip if they are already installed.",
});

// Every Linux tab runs `sudo`, and a system installed with a root password, such as a minimal Debian, can leave
// an account without it. The check finds out; each distribution's line makes the account a `sudo` user, run as
// root through `su`, which asks for the root password. `$(whoami)` names the account before `su` runs, and
// Arch, whose `sudo` package grants the `wheel` group nothing, gets a drop-in that `visudo -c` checks.
const linuxSudo: PanelStep = {
  title: "If sudo is not set up, set it up",
  before: "The steps below run `sudo`. Check that your account can use it:",
  code: "sudo -v",
  after:
    "It asks for your password and prints nothing when the account can use `sudo`: go on to the next step. If it says the account is not in the sudoers file, or the shell says `sudo` is not found, set it up as root. `su` asks for the root password:",
  choose: DISTRO,
  variants: [
    {
      label: "Debian",
      code: 'su - -c "apt-get update && apt-get install -y sudo && usermod -aG sudo $(whoami)"',
    },
    { label: "Fedora or RHEL", code: 'su - -c "usermod -aG wheel $(whoami)"' },
    {
      label: "Arch",
      code: `su - -c "pacman -Syu --needed sudo && usermod -aG wheel $(whoami) && echo '%wheel ALL=(ALL:ALL) ALL' > /etc/sudoers.d/10-wheel && chmod 0440 /etc/sudoers.d/10-wheel && visudo -c"`,
      after: "`visudo -c` must say each file parsed OK.",
    },
  ],
  then: "Then log out and in again, so the account's new group applies, and run `sudo -v` again.",
};

const windowsCompare =
  "Compare those two lines yourself: the letters must match and the case need not, since `Get-FileHash` prints uppercase and the `.sha256` file holds lowercase followed by the file name.";

// Every build from source clones `main`, and the install and move tabs run this same block. `main` is
// described by what the branch ruleset of `ethereumclassic/core-geth` enforces and no more: a pull
// request that needs an approving review and the required checks.
const buildMain = `git clone --branch main --single-branch https://github.com/${REPO.slug}.git &&
  cd core-geth &&
  make geth &&
  ./build/bin/geth version`;

const mainBranch =
  "`main` carries patches and dependency updates before a release does: every change reaches it through a pull request that needs an approving review and the project's required checks. It keeps moving, so two builds a day apart can be different code. It is not a release: until a release is prepared, `geth version` ends its first line with `-unstable`, and its `Git Commit` line names the commit you built.";

// A build from source starts from a machine with none of its tools (maintainer, 2026-11-05), so each
// platform's tab installs them, checks each one's version, and builds. A build needs Git to clone the code
// and to stamp the commit into the binary, Go, a C compiler for the parts written in C, and `make` outside
// Windows. Go is the release `main` pins in `build/checksums.txt` for its own release builds, read at
// build time with the SHA-256 the pin lists for each archive (src/data/toolchain.ts), so a pull request
// that moves the pin moves these steps at this site's next build (maintainer, 2026-11-05: "pinned to
// whatever version is on main"). Each download is checked against its SHA-256 before it is installed. The
// rest comes from each platform's own source: the distribution's packages, Apple's Command Line Tools,
// and WinGet.
const go = await getGoToolchain();
const GO_RELEASE = go.version.replace(/^go/, "");
const goFile = (file: GoFile) => go.files[file];

const goPinned = `\`main\` pins Go ${GO_RELEASE} in its \`build/checksums.txt\`, the Go its release builds use`;
const goArchive = `${goPinned}. This installs Go ${GO_RELEASE} from the Go project's downloads at go.dev, and checks the download against the SHA-256 the same file pins`;

const buildTools = `git --version
go version
gcc --version
make --version`;

// Linux: the distribution's compiler, `make` and Git, then Go from go.dev into `/usr/local/go`, as go.dev
// installs it, linked from `/usr/local/bin`, which every major distribution puts before `/usr/bin` on
// `PATH`, so it runs in place of an older Go from the distribution. `hash -r` makes the shell look `go` up
// again, in case this terminal already ran an older one.
const linuxTools = (lead = ""): PanelStep => ({
  title: "Install Git, a C compiler and make",
  ...(lead ? { before: lead.trim() } : {}),
  choose: DISTRO,
  variants: distros(
    "sudo apt-get update && sudo apt-get install -y build-essential git curl",
    "sudo dnf install -y --refresh gcc make git && sudo dnf upgrade -y gcc make git",
    "sudo pacman -Syu --needed base-devel git",
    archFull,
  ),
  then: "Each line also updates a tool that is already installed. `build-essential` and `base-devel` carry the C compiler and `make`, and the next step downloads with `curl`.",
});

// Go publishes one 32-bit Arm build, `armv6l`, which runs on Arm v6 and v7 alike.
const LINUX_GO = [
  { label: "x86-64", file: "linuxAmd64" },
  { label: "Arm64", file: "linuxArm64" },
  { label: "32-bit Arm", file: "linuxArmv6l" },
] as const;

const linuxGoBlock = (file: GoFile) => `curl -LO https://go.dev/dl/${goFile(file).filename}
echo "${goFile(file).sha256}  ${goFile(file).filename}" | sha256sum -c &&
  sudo rm -rf /usr/local/go &&
  sudo tar -C /usr/local -xzf ${goFile(file).filename} &&
  sudo ln -sf /usr/local/go/bin/go /usr/local/bin/go &&
  hash -r &&
  go version`;

const linuxGo: PanelStep = {
  title: `Install Go ${GO_RELEASE}`,
  before: `${goArchive}. \`uname -m\` names the processor: \`x86_64\` is x86-64, \`aarch64\` is Arm64, and \`armv7l\` or \`armv6l\` is 32-bit Arm:`,
  choose: CPU,
  variants: LINUX_GO.map(({ label, file }) => ({ label, code: linuxGoBlock(file) })),
  then: `\`sha256sum -c\` must print \`OK\`: if it prints \`FAILED\`, delete the file and download it again rather than installing it. The block replaces any Go in \`/usr/local/go\`, and \`go version\` must then print \`${go.version}\`.`,
};

const linuxCheck = {
  title: "Check the tools",
  code: buildTools,
  after: `Each line must print a version, and \`go version\` must print \`${go.version}\`. A line that prints an error names a tool the steps above did not install. If \`go version\` prints another release, a Go earlier on \`PATH\` than \`/usr/local/bin\` runs in its place: uninstall that Go.`,
};

// macOS: Apple's Command Line Tools carry Git, the C compiler and `make`. Go is the pinned archive,
// installed as on Linux, so its SHA-256 is the pin's own. `/usr/local/bin` comes first on macOS's `PATH`,
// and may not exist yet on Apple Silicon.
const macosTools = (lead = "") => ({
  title: "Install the Xcode Command Line Tools",
  ...(lead ? { before: lead.trim() } : {}),
  code: "xcode-select --install",
  after:
    "A window asks whether to install the tools: choose Install, and wait until it says the software was installed. The tools carry Git, the C compiler and `make`. If they are already installed, the command says so: install any update for them that Software Update lists in System Settings, then go on to the next step.",
});

const macosGoBlock = (
  file: "darwinArm64" | "darwinAmd64",
) => `curl -LO https://go.dev/dl/${goFile(file).filename}
echo "${goFile(file).sha256}  ${goFile(file).filename}" | shasum -a 256 -c &&
  sudo rm -rf /usr/local/go &&
  sudo tar -C /usr/local -xzf ${goFile(file).filename} &&
  sudo mkdir -p /usr/local/bin &&
  sudo ln -sf /usr/local/go/bin/go /usr/local/bin/go &&
  hash -r &&
  go version`;

const macosGo: PanelStep = {
  title: `Install Go ${GO_RELEASE}`,
  before: `${goArchive}. ${macUname}`,
  choose: CPU,
  variants: [
    { label: "Apple Silicon", code: macosGoBlock("darwinArm64") },
    { label: "Intel", code: macosGoBlock("darwinAmd64") },
  ],
  then: `\`shasum -a 256 -c\` must print \`OK\`: if it prints \`FAILED\`, delete the file and download it again rather than installing it. The block replaces any Go in \`/usr/local/go\`, and \`go version\` must then print \`${go.version}\`.`,
};

const macosCheck = {
  title: "Check the tools",
  code: buildTools,
  after: `Each line must print a version, and \`go version\` must print \`${go.version}\`. \`gcc --version\` prints Apple clang, the C compiler on macOS. A line that prints an error names a tool the steps above did not install. If \`go version\` prints another release, a Go earlier on \`PATH\`, such as one from Homebrew, runs in its place: uninstall that Go.`,
};

// Windows: the build guide's route, Chocolatey's `mingw` and `git`. `mingw` is MinGW-Builds, the MinGW-w64
// distribution GitHub's Windows runners install, with the same thread, exception and runtime settings, so a
// reader's compiler is the kind the release builds use. WinGet, which comes with Windows 11, installs
// Chocolatey from its publisher, so no script is piped into PowerShell, and its
// agreement flags keep it from stopping at a prompt that would take the next pasted line as its answer. Go is
// go.dev's installer for the pinned release, checked by a line that prints `True` or `False` against the
// SHA-256 go.dev publishes, since the pin lists archives only. The steps run in one administrator window
// (maintainer, 2026-11-05), except that a new one follows WinGet's install of Chocolatey. An administrator
// window opens in `C:\Windows\System32`, so the Go download and the clone start with `cd $HOME`. A window
// keeps the `PATH` it opened with, so the check after the installs starts with the reload line, and
// `msiexec` is piped to `Out-Null` so the window waits for the Go installer to finish.
//
// Every tool ends at its current release, not at whatever is already installed (maintainer, 2026-11-05).
// `choco install` and WinGet both leave an installed package as it is, and `choco upgrade` installs what is
// missing and moves what is installed to its current release, Chocolatey included. Chocolatey's guide to
// version 2 moves a version 1 to 1.4.0 first, a step that would downgrade a version 2, so the page asks which
// one is there.
const windowsChocolateyCheck = (lead = "") => ({
  title: "Check for Chocolatey",
  before: `${lead}In a PowerShell window opened with Run as administrator, which the Chocolatey steps need:`,
  code: "choco --version",
  after:
    'If PowerShell says the term is not recognized, Chocolatey is not installed: take the next step. If the version starts with 1, skip the next step and take the one after it. If it starts with 2, go to "Update Chocolatey, then install Git and a C compiler".',
});

const windowsChocolateyInstall = {
  title: "If Chocolatey is not installed, install it",
  before: "WinGet, which comes with Windows 11, installs Chocolatey from its publisher:",
  code: "winget install --id Chocolatey.Chocolatey -e --source winget --accept-source-agreements --accept-package-agreements",
  after:
    "Approve the prompt the installer shows. Then open a new PowerShell window with Run as administrator for the next steps: a window opened before the install does not find Chocolatey.",
};

const windowsChocolateyV1 = {
  title: "If Chocolatey is version 1, move it to 1.4.0 first",
  code: "choco upgrade chocolatey --version 1.4.0 --allow-downgrade -y",
  after:
    "Chocolatey's [guide to version 2](https://docs.chocolatey.org/en-us/guides/upgrading-to-chocolatey-v2-v6/) moves a version 1 to 1.4.0 before the upgrade to version 2, which the next step makes. Skip this step on version 2: it would downgrade Chocolatey.",
};

const windowsTools = {
  title: "Update Chocolatey, then install Git and a C compiler",
  code: `choco upgrade chocolatey -y
choco upgrade mingw git -y
choco --version`,
  after:
    "`choco upgrade` installs what is missing and moves what is installed to its current release, so an older Chocolatey, Git or MinGW-w64 is updated rather than kept. The last line must print a version starting with 2. If the first line asks for a restart to install .NET Framework 4.8, which Chocolatey 2 needs, restart and run this block again. `mingw` is MinGW-w64, the C compiler cgo needs on Windows. The next two steps can run in this window.",
};

const windowsGoDownload = {
  title: `Download Go ${GO_RELEASE} and check it`,
  before: `${goPinned}. This downloads the Go ${GO_RELEASE} installer from the Go project's downloads at go.dev, and checks the download against the SHA-256 go.dev publishes for the installer. An administrator window opens in \`C:\\Windows\\System32\`, so the first line moves to your home folder:`,
  code: `cd $HOME
Invoke-WebRequest "https://go.dev/dl/${goFile("windowsAmd64").filename}" -OutFile "${goFile("windowsAmd64").filename}"
(Get-FileHash "${goFile("windowsAmd64").filename}" -Algorithm SHA256).Hash -eq "${goFile("windowsAmd64").sha256}"`,
  after:
    "The last line must print `True`. If it prints `False`, delete the file and download it again rather than running it.",
};

const windowsGoInstall = {
  title: "If the check printed True, run the Go installer",
  code: `msiexec /i "$HOME\\${goFile("windowsAmd64").filename}" /passive | Out-Null`,
  after:
    "The installer shows a progress bar and takes its defaults, which put Go in `C:\\Program Files\\Go` and on `PATH`. The line returns once it has finished.",
};

const windowsCheck = {
  title: "Check the tools",
  before: "In the same window:",
  code: `${windowsPathReload}
git --version
go version
gcc --version`,
  after: `The first line reloads \`PATH\` from Windows' settings, so this window finds what the steps above installed. Each line after it must print a version, and \`go version\` must print \`${go.version}\`. A line saying the term is not recognized names a tool the steps above did not install.`,
};

const windowsBuild = `cd $HOME
git clone --branch main --single-branch https://github.com/${REPO.slug}.git
cd core-geth
go run build/ci.go install ./cmd/geth
.\\build\\bin\\geth.exe version`;

// A second build takes the commits that reached `main` since the first, in the same clone. A clone of
// `etclabscore/core-geth`, where the exposed line was published, never gets the recommended line, so on
// Linux and macOS the first line stops the block unless the clone's origin is this repository, and on
// Windows, where the lines run one at a time, the reader reads it.
const rebuildMain = `git -C core-geth remote get-url origin | grep -q '${REPO.slug}' &&
  git -C core-geth pull &&
  cd core-geth &&
  make geth &&
  ./build/bin/geth version`;

const windowsRebuild = `cd $HOME\\core-geth
git remote get-url origin
git pull
go run build/ci.go install ./cmd/geth
.\\build\\bin\\geth.exe version`;

const oldClone = `A clone of \`etclabscore/core-geth\`, where the \`${EXPOSED_LINE}\` line was published, never gets the \`${RECOMMENDED_LINE}\` line: delete that folder and take First build.`;

const buildAgain = {
  label: "Build again",
  before:
    "In the folder that holds the `core-geth` clone an earlier build left, this takes the commits that reached `main` since:",
  code: rebuildMain,
  after: `The first line stops the block unless the clone's origin is \`${REPO.slug}\`. ${oldClone}`,
};

const buildAgainWindows = {
  label: "Build again",
  before:
    "In PowerShell, one line at a time, this takes the commits that reached `main` since the build that cloned `core-geth` into your home folder:",
  code: windowsRebuild,
  after: `The second line must print the address of \`${REPO.slug}\`. ${oldClone}`,
};

const buildChoice = "Choose whether this machine already has the clone";

// The systemd service the documentation's Linux run guide writes, line for line: the `geth` user, the chain
// in `/var/lib/core-geth`, a start at boot, a restart after a failure, and five minutes to stop. The run
// guide says to save the unit as a file, and `sudo tee` saves it from the same paste. Each `sudo` command
// is a block of its own, or chained to the one before it, because a `sudo` line can take the lines still
// waiting in a paste as its password.
const UNIT = `[Unit]
Description=Core-Geth node on Ethereum Classic
Wants=network-online.target
After=network-online.target

[Service]
User=geth
StateDirectory=core-geth
ExecStart=/usr/local/bin/geth --classic --datadir /var/lib/core-geth
Restart=on-failure
TimeoutStopSec=300

[Install]
WantedBy=multi-user.target`;

// The launchd agent the documentation's macOS run guide writes, as it writes it.
const AGENT = `NETWORK=classic
mkdir -p ~/Library/LaunchAgents ~/Library/Logs
cat > ~/Library/LaunchAgents/com.coregeth.$NETWORK.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.coregeth.$NETWORK</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/geth</string>
    <string>--$NETWORK</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <dict>
    <key>SuccessfulExit</key>
    <false/>
  </dict>
  <key>ExitTimeOut</key>
  <integer>300</integer>
  <key>StandardErrorPath</key>
  <string>$HOME/Library/Logs/core-geth-$NETWORK.log</string>
</dict>
</plist>
EOF`;

const agentStop = `NETWORK=classic
launchctl bootout gui/$(id -u)/com.coregeth.$NETWORK`;

const agentStart = `NETWORK=classic
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.coregeth.$NETWORK.plist`;

// The Startup folder's command file, as the documentation's Windows run guide writes it, and its start.
const startupFile = `$startup = [Environment]::GetFolderPath('Startup')
Set-Content "$startup\\core-geth-classic.cmd" '@title Core-Geth: Ethereum Classic', '"C:\\core-geth\\geth.exe" --classic'`;

const startupStart = `$startup = [Environment]::GetFolderPath('Startup')
Start-Process "$startup\\core-geth-classic.cmd"`;

// Starting a node is the last install step of every install tab, a download or a build from source, in a
// block of its own that a failed check or install above it cannot reach. Each start offers the way the
// documentation's run guide keeps a node running, so a later step that stops or starts a service has one
// this site set up.
const startLinux: PanelStep = {
  title: "Start a node on Ethereum Classic",
  before: `Other nodes reach yours on port 30303, over TCP and UDP: allow that port through your firewall, as [A host firewall](${DOCS_URL}operate/security/#a-host-firewall) shows. Then start the node in a terminal, or as a systemd service that starts it at boot.`,
  choose: RUNS,
  variants: [
    {
      label: IN_TERMINAL,
      code: "geth --classic",
      after:
        "The node runs in this terminal until you stop it with Ctrl-C, so run the next step in a second terminal. For the Mordor test network, run `geth --mordor` instead.",
    },
    {
      label: SYSTEMD,
      before: `As the documentation's [Linux run guide](${RUN_LINUX}) sets it up, the service runs the node as a \`geth\` user of its own, starts it at boot, restarts it after a failure, and gives it five minutes to stop. Create the user:`,
      code: "sudo useradd --system --create-home --shell /usr/sbin/nologin geth",
      after:
        "`--create-home` matters: `geth attach` needs a home directory it can write to. If the user already exists, `useradd` says so, and you can go on.",
      more: [
        {
          before: "Save the unit, which keeps the chain in `/var/lib/core-geth`:",
          code: `sudo tee /etc/systemd/system/core-geth.service > /dev/null <<'EOF'
${UNIT}
EOF`,
          after:
            "A flag you start the node with, such as `--mess` or `--mess=false`, goes at the end of the `ExecStart` line.",
        },
        {
          before: "Start it now and at every boot:",
          code: "sudo systemctl daemon-reload && sudo systemctl enable --now core-geth",
        },
        {
          before: "Follow its log. Ctrl-C stops following it, and the node keeps running:",
          code: "sudo journalctl -u core-geth -f",
          after:
            "For Mordor, save the unit as `/etc/systemd/system/core-geth-mordor.service`, with `Description=Core-Geth node on Mordor`, `StateDirectory=core-geth-mordor` and `ExecStart=/usr/local/bin/geth --mordor --datadir /var/lib/core-geth-mordor` in place of the lines they match, and use `core-geth-mordor` in place of `core-geth` in these commands.",
        },
      ],
    },
  ],
};

const startMacos: PanelStep = {
  title: "Start a node on Ethereum Classic",
  before:
    "Other nodes reach yours on port 30303, over TCP and UDP. Start the node in a terminal, or as a launchd agent that starts it when you log in.",
  choose: RUNS,
  variants: [
    {
      label: IN_TERMINAL,
      code: "geth --classic",
      after:
        "The node runs in this terminal until you stop it with Ctrl-C, so run the next step in a second terminal window. For the Mordor test network, run `geth --mordor` instead.",
    },
    {
      label: LAUNCHD,
      before: `As the documentation's [macOS run guide](${RUN_MACOS}) sets it up, the agent starts the node when you log in, restarts it after a failure, and gives it five minutes to stop. It runs while you are logged in, and a Mac that sleeps pauses the node until it wakes. Write the agent, with \`NETWORK\` set to \`classic\`, or to \`mordor\` for the test network:`,
      code: AGENT,
      after:
        "A flag you start the node with goes in `ProgramArguments`, as a `<string>` line of its own after `<string>--$NETWORK</string>`, joining the flag to its value with `=`: `<string>--mess=false</string>`.",
      more: [
        {
          before: "Start it now. It starts again each time you log in:",
          code: agentStart,
        },
        {
          before: "Follow its log. Ctrl-C stops following it, and the node keeps running:",
          code: "tail -f ~/Library/Logs/core-geth-$NETWORK.log",
        },
      ],
    },
  ],
};

const startWindows: PanelStep = {
  title: "Start a node on Ethereum Classic",
  choose: RUNS,
  variants: [
    {
      label: IN_WINDOW,
      code: `cd C:\\core-geth
.\\geth.exe --classic`,
      after:
        "The node runs in this window until you stop it with Ctrl+C, so run the next step in a second window. A click in the window starts a text selection, which pauses the node until you press Esc. For the Mordor test network, run `.\\geth.exe --mordor` instead.",
    },
    {
      label: STARTUP,
      before: `As the documentation's [Windows run guide](${RUN_WINDOWS}) sets it up, a command file in your Startup folder starts the node in a window of its own each time you sign in. Write the file:`,
      code: startupFile,
      after:
        "A flag you start the node with, such as `--mess` or `--mess=false`, goes after `--classic` on the file's second line. For Mordor, use `core-geth-mordor.cmd`, `Core-Geth: Mordor` and `--mordor`.",
      more: [
        {
          before: "Then start the node now, without signing out:",
          code: startupStart,
          after:
            'Ctrl+C in the node\'s window stops it cleanly, and the window then asks `Terminate batch job (Y/N)?`: type `Y`. To stop the node starting at sign-in, delete the file with `Remove-Item "$startup\\core-geth-classic.cmd"`.',
        },
      ],
    },
  ],
  then: "The first start can raise a Windows Security alert asking whether to allow `geth.exe` through the firewall: allow it, so other nodes can connect to yours on port 30303.",
};

// After the start, every install tab checks the node with the documentation's run guides' commands.
const syncNote = `\`eth.syncing\` prints an object while the node syncs and \`false\` once it has synced. \`net.peerCount\` rises above zero within minutes: if it is still zero after five minutes, see [Why does the node have no peers?](${DOCS_URL}operate/troubleshooting/#why-does-the-node-have-no-peers), and if the lists and bootnodes have gone dark, [start it once from the node records](${DARK_LISTS}). Once the node has synced, compare \`eth.blockNumber\` with a block explorer. [How to tell it is done](${DOCS_URL}getting-started/run-classic-node/#how-to-tell-it-is-done) lists every sign of a finished sync.`;

const attachLines = `geth --classic attach --exec 'eth.syncing'
geth --classic attach --exec 'net.peerCount'
geth --classic attach --exec 'eth.blockNumber'`;

// The service's socket belongs to `geth`, so its attach lines run as `geth`, chained so that a password
// prompt cannot take the lines after the first.
const asGeth = (exec: string, last = false) =>
  `sudo -u geth -H geth --classic attach --exec '${exec}' /var/lib/core-geth/geth.ipc${last ? "" : " &&"}`;

const syncLinux: PanelStep = {
  title: "Check that it syncs",
  choose: RUNS,
  variants: [
    {
      label: IN_TERMINAL,
      before: "In a second terminal:",
      code: attachLines,
      after: "For Mordor, use `--mordor` in place of `--classic`.",
    },
    {
      label: SYSTEMD,
      before:
        "The node's socket belongs to `geth`, and only `geth` and root can connect to it, so attach as `geth`. `-H` gives it `geth`'s home directory to write to:",
      code: `${asGeth("eth.syncing")}
  ${asGeth("net.peerCount")}
  ${asGeth("eth.blockNumber", true)}`,
      after: "For Mordor, use `--mordor` and `/var/lib/core-geth-mordor/geth.ipc`.",
    },
  ],
  then: syncNote,
};

const syncMacos: PanelStep = {
  title: "Check that it syncs",
  before:
    "In a second terminal window. The launchd agent runs the node as you, with the default data directory, so these lines reach it as well:",
  code: attachLines,
  after: `For Mordor, use \`--mordor\` in place of \`--classic\`. ${syncNote}`,
};

const syncWindows: PanelStep = {
  title: "Check that it syncs",
  before: "In a second PowerShell window, whichever way the node started:",
  code: `cd C:\\core-geth
.\\geth.exe attach --exec 'eth.syncing'
.\\geth.exe attach --exec 'net.peerCount'
.\\geth.exe attach --exec 'eth.blockNumber'`,
  after: `The lines are the same on Mordor: \`attach\` connects to the named pipe \`\\\\.\\pipe\\geth.ipc\`, which the running node opens whatever its network. ${syncNote}`,
};

const syncContainer: PanelStep = {
  title: "Check that it syncs",
  before: "Follow the node's log. Ctrl-C stops following it, and the node keeps running:",
  code: "docker logs -f core-geth-classic",
  more: [
    {
      before: "Then ask the node itself:",
      code: `docker exec core-geth-classic geth --classic attach --exec 'eth.syncing'
docker exec core-geth-classic geth --classic attach --exec 'net.peerCount'
docker exec core-geth-classic geth --classic attach --exec 'eth.blockNumber'`,
    },
  ],
  then: `For Mordor, use \`core-geth-mordor\` and \`--mordor\`. ${syncNote}`,
};

// A new release on the same line keeps the chain and the P2P node key: the documentation's five steps are to
// read what changed, download and check the release, stop the node, replace the binary and start it, and
// check the result. The download blocks above end by printing `geth version`.
const updateTitle = "When a new release ships, update the node";
const keeps = "The node keeps its chain and its P2P node key.";
const terminalStop =
  "Press Ctrl-C once in the node's terminal, and wait for `Blockchain stopped` and the prompt.";
const rerunDownload =
  'Run the block in "Download the release, check it and install it" again, which installs the new release over the old one';

const updateLinux: PanelStep = {
  title: updateTitle,
  before: `${releaseNotes} ${keeps}`,
  choose: RUNS,
  variants: [
    {
      label: IN_TERMINAL,
      before: `${terminalStop} ${rerunDownload}, then start the node:`,
      code: "geth --classic",
    },
    {
      label: SYSTEMD,
      before: "Stop the service:",
      code: "sudo systemctl stop core-geth",
      more: [
        {
          before: `${rerunDownload}, then start the service:`,
          code: "sudo systemctl start core-geth",
        },
      ],
    },
  ],
};

const updateMacos: PanelStep = {
  title: updateTitle,
  before: `${releaseNotes} ${keeps}`,
  choose: RUNS,
  variants: [
    {
      label: IN_TERMINAL,
      before: `${terminalStop} ${rerunDownload}, then start the node:`,
      code: "geth --classic",
    },
    {
      label: LAUNCHD,
      before: "Unload the agent, which stops the node:",
      code: agentStop,
      more: [{ before: `${rerunDownload}, then start the agent:`, code: agentStart }],
      after: "For Mordor, set `NETWORK` to `mordor`.",
    },
  ],
};

const windowsStop =
  "Press Ctrl+C once in the node's window, and wait for `Blockchain stopped` and for the node to exit. A window opened from the Startup folder then asks `Terminate batch job (Y/N)?`: type `Y`.";

const updateWindows: PanelStep = {
  title: updateTitle,
  before: `${releaseNotes} ${keeps} ${windowsStop} Run the blocks in "Download the release and check it" and "If the two lines match, unpack the release" again, then start the node:`,
  choose: RUNS,
  variants: [
    {
      label: IN_WINDOW,
      code: `cd C:\\core-geth
.\\geth.exe --classic`,
    },
    { label: STARTUP, code: startupStart },
  ],
};

const updateContainer: PanelStep = {
  title: updateTitle,
  before: `${releaseNotes} The volume keeps the chain and the P2P node key, so the node resumes where it stopped. Pull the new image and check it with the block in "Pull the published image and check where it came from", then remove the old container:`,
  code: "docker stop core-geth-classic && docker rm core-geth-classic",
  after:
    'Then run the block in "Start a node, keeping the chain in a named volume" again, with any flag you added. For Mordor, use `core-geth-mordor`.',
};

// A build from source updates by building `main` again, which can run while the node does, then stopping the
// node, installing the build and starting it.
const sourceUpdateTitle = "Update to a newer build of main";
const rebuildFirst =
  'Take Build again in "Build the main branch": the node can keep running while it builds. Then stop the node, install the build, and start it.';
const rerunInstall = 'Run the block in "Install the build" again, in the clone';

const updateSourceUnix = (service: "linux" | "macos"): PanelStep => ({
  title: sourceUpdateTitle,
  before: rebuildFirst,
  choose: RUNS,
  variants: [
    {
      label: IN_TERMINAL,
      before: `${terminalStop} ${rerunInstall}, then start the node:`,
      code: "geth --classic",
    },
    service === "linux"
      ? {
          label: SYSTEMD,
          before: "Stop the service:",
          code: "sudo systemctl stop core-geth",
          more: [
            {
              before: `${rerunInstall}, then start the service:`,
              code: "sudo systemctl start core-geth",
            },
          ],
        }
      : {
          label: LAUNCHD,
          before: "Unload the agent, which stops the node:",
          code: agentStop,
          more: [{ before: `${rerunInstall}, then start the agent:`, code: agentStart }],
        },
  ],
});

const updateSourceWindows: PanelStep = {
  title: sourceUpdateTitle,
  before: `${rebuildFirst} ${windowsStop} ${rerunInstall}, then start the node:`,
  choose: RUNS,
  variants: [
    {
      label: IN_WINDOW,
      code: `cd C:\\core-geth
.\\geth.exe --classic`,
    },
    { label: STARTUP, code: startupStart },
  ],
};

// A build from source installs where the downloads do, so it starts the same way: `/usr/local/bin` on Linux
// and macOS, which a new Mac can lack, and `C:\core-geth` on Windows, where the Windows download unpacks.
const installBuild = (mac = false) => ({
  title: "Install the build",
  code: `ls build/bin/geth &&${mac ? "\n  sudo mkdir -p /usr/local/bin &&" : ""}
  sudo install -m 0755 build/bin/geth /usr/local/bin/geth &&
  geth version`,
  after:
    "Run this in the folder the build step left you in: the first line stops the block anywhere else. `geth version` must print the same first line and `Git Commit` line the build printed.",
});

const installBuildWindows = {
  title: "Install the build",
  code: `New-Item -ItemType Directory -Force C:\\core-geth | Out-Null
Copy-Item .\\build\\bin\\geth.exe C:\\core-geth\\geth.exe
C:\\core-geth\\geth.exe version`,
  after:
    "Run these in the `core-geth` folder the build step left you in. The last line must print the same first line and `Git Commit` line the build printed. `C:\\core-geth` is where the Windows download puts the client, so a node starts the same way from either.",
};

// Building `main` the first time clones it, and building it again pulls the commits that reached it since.
const firstBuildNote =
  "An existing `core-geth` folder stops First build at the clone rather than building an old copy: take Build again instead.";

const buildStepUnix: PanelStep = {
  title: "Build the main branch",
  choose: buildChoice,
  variants: [{ label: "First build", code: buildMain, after: firstBuildNote }, buildAgain],
  then: mainBranch,
};

const buildStepWindows: PanelStep = {
  title: "Build the main branch",
  choose: buildChoice,
  variants: [
    {
      label: "First build",
      before: "In PowerShell, one line at a time:",
      code: windowsBuild,
      after: "If `git clone` reports that `core-geth` already exists, take Build again instead.",
    },
    buildAgainWindows,
  ],
  then: mainBranch,
};

// The build-from-source tabs under Install: one per platform, each from nothing installed to a node that
// syncs, and how to build it again.
export const SOURCE_PANELS: readonly PlatformPanel[] = [
  {
    id: "linux",
    label: "Linux",
    heading: "Build from source on Linux",
    steps: [
      linuxSudo,
      linuxTools(),
      linuxGo,
      linuxCheck,
      buildStepUnix,
      installBuild(),
      startLinux,
      syncLinux,
      updateSourceUnix("linux"),
    ],
    guide: { label: "Build from source", href: DOCS.buildFromSource.href },
  },
  {
    id: "macos",
    label: "macOS",
    heading: "Build from source on macOS",
    steps: [
      macosTools(),
      macosGo,
      macosCheck,
      buildStepUnix,
      installBuild(true),
      startMacos,
      syncMacos,
      updateSourceUnix("macos"),
    ],
    guide: { label: "Build from source", href: DOCS.buildFromSource.href },
  },
  {
    id: "windows",
    label: "Windows",
    heading: "Build from source on Windows",
    steps: [
      windowsChocolateyCheck(),
      windowsChocolateyInstall,
      windowsChocolateyV1,
      windowsTools,
      windowsGoDownload,
      windowsGoInstall,
      windowsCheck,
      buildStepWindows,
      installBuildWindows,
      startWindows,
      syncWindows,
      updateSourceWindows,
    ],
    guide: { label: "Build from source", href: DOCS.buildFromSource.href },
  },
];

// A release archive for each processor, from the latest release: Linux installs with `install`, and macOS
// first makes `/usr/local/bin`, which a new Mac can lack.
const linuxDownloadInstall = (
  token: string,
) => `curl -LO ${assetBase}/core-geth-${token}-${releaseTag}.zip
curl -LO ${assetBase}/core-geth-${token}-${releaseTag}.zip.sha256
sha256sum -c core-geth-${token}-${releaseTag}.zip.sha256 &&
  unzip -o core-geth-${token}-${releaseTag}.zip &&
  sudo install -m 0755 geth /usr/local/bin/geth &&
  geth version`;

const macosDownloadInstall = (
  token: string,
) => `curl -LO ${assetBase}/core-geth-${token}-${releaseTag}.zip
curl -LO ${assetBase}/core-geth-${token}-${releaseTag}.zip.sha256
shasum -a 256 -c core-geth-${token}-${releaseTag}.zip.sha256 &&
  unzip -o core-geth-${token}-${releaseTag}.zip &&
  sudo mkdir -p /usr/local/bin &&
  sudo install -m 0755 geth /usr/local/bin/geth &&
  geth version`;

// One panel per platform the project publishes for, plus source. Every command is the one
// its linked guide gives, with that guide's version comment dropped, because the site
// names no version of its own. There is no iOS or Android tab: no release publishes a
// mobile artifact to put in one.
//
// No block carries a `$` or `>` prompt: a reader selects the whole block and pastes it
// into a shell, so a prompt would have to be stripped line by line first. Expected output
// goes on a comment line of its own, or in the note under the block.
//
// The macOS blocks carry no comments at all, and no block carries one after a command. Stock
// zsh, the macOS default, treats `#` in a paste as a command or an argument, so a comment line
// prints an error and a trailing comment makes `shasum -c` fail on the `#`. The Windows blocks
// can carry comments, which PowerShell reads as comments.
//
// A pasted block carries on past a failed line. So where a block checks what it downloaded, the
// lines after the check are chained to it, and the line that starts a node sits in a block of its
// own, which a failed check cannot reach. PowerShell's check is two lines a reader compares by eye,
// and a paste does not wait for the reader, so on Windows nothing follows those lines in their block.
export const PANELS: readonly PlatformPanel[] = [
  {
    id: "linux",
    label: "Linux",
    steps: [
      linuxSudo,
      linuxFetchTools(),
      {
        title: "Download the release, check it and install it",
        before: linuxUname,
        choose: CPU,
        variants: LINUX_CPUS.map(({ label, token }) => ({
          label,
          code: linuxDownloadInstall(token),
        })),
        then: "`sha256sum -c` must print `OK`: if it prints `FAILED`, delete the file and download it again rather than running it.",
      },
      startLinux,
      syncLinux,
      updateLinux,
    ],
    guide: { label: "Linux users guide", href: `${DOCS_URL}getting-started/run/linux/` },
  },
  {
    id: "macos",
    label: "macOS",
    steps: [
      {
        title: "Download the release, check it and install it",
        before: macUname,
        choose: CPU,
        variants: MAC_CPUS.map(({ label, token }) => ({
          label,
          code: macosDownloadInstall(token),
        })),
        then: "`shasum -a 256 -c` must print `OK`: if it prints `FAILED`, delete the file and download it again rather than running it. A browser download carries the quarantine attribute, which macOS blocks: `xattr -d com.apple.quarantine geth` clears it.",
      },
      startMacos,
      syncMacos,
      updateMacos,
    ],
    guide: { label: "macOS users guide", href: `${DOCS_URL}getting-started/run/macos/` },
  },
  {
    id: "windows",
    label: "Windows",
    steps: [
      {
        title: "Download the release and check it",
        code: `# In PowerShell
Invoke-WebRequest "${assetBase}/core-geth-win64-${releaseTag}.zip" -OutFile "core-geth-win64-${releaseTag}.zip"
Invoke-WebRequest "${assetBase}/core-geth-win64-${releaseTag}.zip.sha256" -OutFile "core-geth-win64-${releaseTag}.zip.sha256"

# Compare these two lines
(Get-FileHash "core-geth-win64-${releaseTag}.zip" -Algorithm SHA256).Hash
Get-Content "core-geth-win64-${releaseTag}.zip.sha256"`,
        after: `${windowsCompare} If they differ, delete the file and download it again rather than running it.`,
      },
      {
        title: "If the two lines match, unpack the release",
        code: `Expand-Archive "core-geth-win64-${releaseTag}.zip" -DestinationPath C:\\core-geth -Force
C:\\core-geth\\geth.exe version`,
        after: `The first line \`geth.exe version\` prints must name a \`${RECOMMENDED_LINE}\` release.`,
      },
      startWindows,
      syncWindows,
      updateWindows,
    ],
    guide: { label: "Windows users guide", href: `${DOCS_URL}getting-started/run/windows/` },
  },
  {
    id: "containers",
    label: "Containers",
    steps: [
      containerStep("pull and run the image"),
      {
        title: "Pull the published image and check where it came from",
        code: `docker pull ghcr.io/${REPO.slug}:latest
gh attestation verify oci://ghcr.io/${REPO.slug}:latest --repo ${REPO.slug}`,
        after: attestationMust("docker-publish.yml", "run the image"),
      },
      {
        title: "Start a node, keeping the chain in a named volume",
        code: `docker run --rm ghcr.io/${REPO.slug}:latest version
docker run -d --name core-geth-classic \\
    --restart unless-stopped --stop-timeout 300 \\
    -v core-geth-classic:/root \\
    -p 30303:30303 -p 30303:30303/udp \\
    ghcr.io/${REPO.slug}:latest --classic`,
        after:
          "The first line confirms that the image runs. The volume is mounted at `/root`, so the chain survives the container being replaced, and `--restart unless-stopped` starts the container again after a failure or a reboot. For Mordor, run the same command with `core-geth-mordor` as the container and volume name and `--mordor` as the flag.",
      },
      syncContainer,
      updateContainer,
    ],
    guide: { label: "Docker users guide", href: `${DOCS_URL}getting-started/run/docker/` },
  },
  {
    id: "source",
    label: "Source",
    // Its steps are the build-from-source tabs, SOURCE_PANELS, passed through the panel's slot.
    steps: [],
  },
];

export const groupFor = (id: string) => downloads?.groups.find((group) => group.id === id);

const cleanStop =
  "Wait until the log prints `Blockchain stopped` and the process exits. If it exits without that line, the stop was not clean: the node recovers at its next start, and its block number can start lower than the one you recorded.";

const keepId =
  'Keep what this prints: "Confirm the move" compares the new ID and block number with it.';

const rotationRequired =
  "The next start writes a fresh key. If you start the node with `--nodekey` or `--nodekeyhex`, or set `GETH_NODEKEY` or `GETH_NODEKEYHEX`, take that out too: it overrides the file. If the rename prints an error, check the data directory: `geth/nodekey` must not be there when the node starts.";

const verifyPointer =
  "[Verify what you downloaded](/downloads/#verify) also checks where the file came from.";

const keepBinary = `\`geth-${EXPOSED_LINE}\` is the old binary, kept so you can roll back.`;

const binaryPath =
  "These commands install over `/usr/local/bin/geth`, and `command -v geth` shows where yours is. If your unit or start command runs a `geth` at another path, use that path wherever they say `/usr/local/bin/geth`.";

// The first line names a release on every tab but Source, which builds `main`, so that tab checks the
// running node against what its own build printed.
const confirmNote = (version = `The first line must name a \`${RECOMMENDED_LINE}\` release.`) =>
  `If an attach line cannot connect, wait a minute and run it again. ${version} The enode ID must differ from the one you recorded. If it is the same, the node is still on the old key: stop it and redo the rename step. The peer count climbs within minutes. If it is still zero after five minutes, see [Why does the node have no peers?](${DOCS_URL}operate/troubleshooting/#why-does-the-node-have-no-peers), and if the lists and bootnodes have gone dark, [start it once from the node records](${DARK_LISTS}) committed in \`${LISTS_REPO.slug}\`. The block number starts near the one you recorded, or lower after an unclean stop, and climbs to the network's head: compare it with a block explorer or another node you run. If it stops climbing short of the head, investigate rather than resync.`;

// Peers a node lists by ID, in the file it reads at the start or on the console while it runs. The new
// ID exists only after the first start on the new key, so one step edits this node's own list while it
// is down, and another, after the start, gives the new ID to the nodes that list this one. Measured
// across a rotation, from `v1.12.17` up: a two-line file changes nothing but the list, and a console
// change lasts until that node restarts.
// A node with no config file yet gets one at a path each platform names, holding the example entry the reader
// then replaces: the home folder for a node run in a terminal or by its launchd agent, `/etc/core-geth` for the
// systemd service, whose `geth` user reads it there, the node's folder on Windows, and the host for a container.
// PowerShell's `WriteAllLines` writes UTF-8 with no byte order mark, which the client's TOML reader needs.
const peerList = `[Node.P2P]
StaticNodes = ["enode://<node ID>@<IP>:30303"]`;

const writePeers = (path: string) => `cat > ${path} <<'EOF'
${peerList}
EOF`;

const peersNotes =
  "A peer that has already moved has a new ID, so use that. Separate entries with commas. `TrustedNodes` takes the same entries. The client ignores `static-nodes.json`, so move its entries here.";

const noFileYet = "With no file yet, this writes one holding the example entry,";
const fillIn = "Then open it in a text editor and put your peers in place of the example entry";

const staticPeersStep = (platform: "linux" | "macos" | "windows" | "containers"): PanelStep => {
  const base = {
    title: "If this node lists static peers, update the list",
    before:
      "They are under `[Node.P2P]` in the file you pass with `--config`. Edit it while the node is down:",
    code: peerList,
    after: peersNotes,
  };
  if (platform === "linux") {
    return {
      ...base,
      choose: RUNS,
      variants: [
        {
          label: IN_TERMINAL,
          before: `${noFileYet} in your home folder:`,
          code: writePeers("~/core-geth.toml"),
          after: `${fillIn}, and add \`--config ~/core-geth.toml\` to the start command.`,
        },
        {
          label: SYSTEMD,
          before: `${noFileYet} where the \`geth\` user can read it:`,
          code: `sudo mkdir -p /etc/core-geth &&
  sudo tee /etc/core-geth/config.toml > /dev/null <<'EOF'
${peerList}
EOF`,
          more: [
            {
              before: "Then put your peers in place of the example entry:",
              code: "sudoedit /etc/core-geth/config.toml",
              after:
                "Add `--config /etc/core-geth/config.toml` to the end of the unit's `ExecStart` line, with the flags the start step has you add.",
            },
          ],
        },
      ],
    };
  }
  if (platform === "macos") {
    return {
      ...base,
      more: [
        {
          before: `${noFileYet} in your home folder:`,
          code: writePeers("~/core-geth.toml"),
          after: `${fillIn}, and add \`--config ~/core-geth.toml\` to the start command.`,
        },
        {
          before:
            "For the run guide's launchd agent, which does not expand `~`, this prints the line to add to its `ProgramArguments`:",
          code: 'echo "<string>--config=$HOME/core-geth.toml</string>"',
        },
      ],
    };
  }
  if (platform === "windows") {
    return {
      ...base,
      after: `${peersNotes} Save the file as UTF-8 with no byte order mark, after this edit and any other: a byte order mark, or UTF-16, stops the start with \`invalid TOML syntax\`. In Notepad, that is the encoding UTF-8, not UTF-8 with BOM.`,
      more: [
        {
          before: `${noFileYet} in UTF-8 with no byte order mark. In PowerShell, in the folder that holds the node's \`geth.exe\`:`,
          code: `[IO.File]::WriteAllLines("$PWD\\config.toml", @('[Node.P2P]', 'StaticNodes = ["enode://<node ID>@<IP>:30303"]'))`,
        },
        {
          before: "Then put your peers in place of the example entry:",
          code: "notepad .\\config.toml",
          after:
            "Notepad keeps the file's UTF-8 when you save it. Add `--config` and the file's full path, such as `--config C:\\core-geth\\config.toml`, to the start command, or after `--classic` in the Startup folder's command file.",
        },
      ],
    };
  }
  return {
    ...base,
    after: `${peersNotes} To give the new container a file, add \`-v\` and its path on the host, mounted as \`/config.toml:ro\`, to the \`docker run\` under "Replace the container", and \`--config /config.toml\` after the image name.`,
    more: [
      {
        before: `${noFileYet} on the host:`,
        code: writePeers("$HOME/core-geth-config.toml"),
        after: `${fillIn}. Then add \`-v $HOME/core-geth-config.toml:/config.toml:ro\` and \`--config /config.toml\` as above.`,
      },
    ],
  };
};

const otherNodesStep = (attach: string, ipc: string, extra = "", beforeExtra = "") => ({
  title: "If other nodes list this node, give them the new ID",
  before: `They can no longer connect to this node, and neither side logs it at the default verbosity. On each one, on \`${EXPOSED_LINE}\` or \`${RECOMMENDED_LINE}\`, run these lines with the old ID you recorded, the new ID from the step above, and the address and port the entry already has.${beforeExtra}`,
  code: `${attach} --exec "admin.removePeer('enode://<old ID>@<IP>:30303')" ${ipc}
${attach} --exec "admin.addPeer('enode://<new ID>@<IP>:30303')" ${ipc}
${attach} --exec "admin.peers.map(function(p){return p.enode})" ${ipc}`,
  after: `The first two lines each print \`true\` and take effect with no restart. The third lists the new ID once the nodes connect. The change lasts only until that node restarts, so put the new ID in that node's own config file too. Send the new ID to anyone else who lists this node. For an entry in \`TrustedNodes\`, use \`admin.removeTrustedPeer\` and \`admin.addTrustedPeer\` in place of the first two lines, or as well as them if the entry is in \`StaticNodes\` too. Neither opens a connection. [Static and trusted peers](${DOCS_URL}guides/bootnodes-and-discovery/#static-and-trusted-peers) explains the two lists.${extra}`,
});

// While the node is down, in the guide's order: MESS is in its "What changes" and the RPC check is
// its step 4. Neither has a command of its own, because both are flags the reader already sets. A
// file `dumpconfig` wrote on `v1.12` is in neither. From `v1.12.19` up it loads and silently keeps
// that release's discovery lists and bootnodes, so the note says what to delete. The note does not warn
// about the old `ECBP1100` and `ECBP1100Disable` keys, because that reads as a break the release does
// not have: `v1.13` reads `OverrideECBP1100`, `OverrideECBP1100Deactivate` and `ECBP1100NoDisable`.
// `v1.12.17` and `v1.12.18` refuse their own `"<nil>"` dump, every release from `v1.12.19` refuses a
// value in those two keys, and the `Fatal` line names the key.
const checkFlags = {
  title: "Check the flags and settings you start the node with",
  after: `While the node is down, decide MESS, which makes a node resist deep chain reorganizations. An upgrade can change whether a node runs MESS, so set it yourself: \`--mess\` turns it on and \`--mess=false\` turns it off. [Which setting fits which operator](${DOCS.messSetting.href}) sets out the choice. An exchange setting its confirmation policy can use the [MESS confirmation calculator](${DOCS_URL}guides/mess-calculator/) to see what that policy asks of an attacker. Give every node you run the same setting. Take out any \`--discovery.dns\` or \`--bootnodes\` flag added on \`${EXPOSED_LINE}\`, the two [${GUIDE_PAGES.discovery.title}](${GUIDE_PAGES.discovery.href}) adds among them: the \`${RECOMMENDED_LINE}\` line reads its own lists and bootnodes, \`--bootnodes\` would hold the node to the bootnodes it names, and with \`--discovery.dns\` it reads no snap lists. If the node starts with \`--config\`, delete the file's \`BootstrapNodes\`, \`EthDiscoveryURLs\` and \`SnapDiscoveryURLs\` lines, unless you put them there to name bootnodes or lists other than the release's own: a file \`dumpconfig\` wrote on \`${EXPOSED_LINE}\` has all three, and the node keeps what they name in place of what the \`${RECOMMENDED_LINE}\` line ships. The lists that guide puts in a file are the release's own, so delete those too. \`BootstrapNodesV5\` can stay: the \`${RECOMMENDED_LINE}\` line puts its own discovery v5 bootnodes in place of the ones a \`${EXPOSED_LINE}\` file holds. Then go through the [RPC exposure checklist](${DOCS.migration.href}#re-check-rpc-exposure) for the flags, any \`GETH_\` environment variables, and the file's \`[Node]\` settings: \`HTTPHost\`, \`HTTPModules\`, \`HTTPCors\`, \`WSHost\`, \`WSModules\` and \`WSOrigins\`.`,
};

// For an operator who has not run the recommended line yet: one new node first, beside the nodes they
// run, then the move (maintainer, 2026-11-03). It is optional and best practice, and done when it has
// caught up and holds peers (maintainer, 2026-11-04). The install steps suit it,
// because it has no old key, and it gets a machine of its own, because those steps install over the
// `geth` on `PATH` and start on the default data directory. It peers and syncs, but no RPC clients or
// miners point at it, as the census lede on `/security/` says, because the documentation's migration guide asks for one
// MESS setting per fleet and a release's MESS default need not match the fleet's. It may start from a
// copy of a stopped `v1.12` node's data directory without its `geth/nodekey` (maintainer, 2026-11-04):
// a copy carries the key, and that key is the exposed one, which the move section's lede explains.
const trialNode = {
  title: `Optional: if you have not run ${RECOMMENDED_LINE} yet, sync one new node first`,
  after: `Best practice before you move a \`${EXPOSED_LINE}\` node: set up one new node on the \`${RECOMMENDED_LINE}\` line, on a machine of its own beside the nodes you run, by following [${GUIDE_PAGES.install.title}](${GUIDE_PAGES.install.href}), and point no RPC clients or miners at it. It can sync from the network, or start from a copy of a stopped \`${EXPOSED_LINE}\` node's data directory without its \`geth/nodekey\`. Once \`eth.syncing\` returns \`false\` and \`net.peerCount\` is above zero ([How to tell it is done](${DOCS_URL}getting-started/run-classic-node/#how-to-tell-it-is-done)), move each \`${EXPOSED_LINE}\` node with the steps below.`,
};

// Every move tab ends with a running node (maintainer, 2026-11-05: "when i finish the instruction i am running
// an ethereum classic node"). The start block is the run guide's own start line, and the note above it, which
// a reader meets before pasting, says to add the node's own flags, the MESS setting just decided among them,
// or to start the node the way its run guide's service does.
const startFlags =
  "Add the flags you just checked to this line, `--mess` or `--mess=false` among them, and any other flag you start the node with: a node on `--datadir` started without it starts an empty chain in the default directory.";

// Rolling back is for a short while (maintainer, 2026-11-08): it puts the old binary or container back so
// the node runs while the cause is found, then the move runs again, and every move tab ends by deleting
// the old binary once the node is stable, because every `v1.12` release carries the flaws the audits
// found. The rollback commands are each platform's migration guide's in the documentation. A second rename on the same day
// meets the first one's target: GNU `mv -n` refuses it with `not replacing`, and the note names the fix.
const rollbackTitle = "If you need to roll back";
const removeOldTitle = `Once the node is stable, delete the ${EXPOSED_LINE} binary`;

const rollbackAfter = (date: string) =>
  `Roll back only for as long as it takes to find what went wrong: every \`${EXPOSED_LINE}\` release carries the flaws the audits found. Keep the new key: rolling back does not make the old key safe, and a release before \`${EXPOSED_LINE}.21\` leaks bits of the key it runs with, so rolling back to one exposes the new key too. Once the cause is fixed, move again with these steps, renaming the key again. A second rename on the same day finds its target name taken, so add \`-2\` after \`${date}\` in it. If the node has to stay back longer, [${GUIDE_PAGES.discovery.title}](${GUIDE_PAGES.discovery.href}) keeps it finding peers.`;

const swapsBinary = `The data directory works with both lines, so rolling back swaps the binary. A \`${EXPOSED_LINE}\` binary refuses the \`--mess\` flag, so the node starts again without it.`;

const restoreUnix = `sudo mv /usr/local/bin/geth-${EXPOSED_LINE} /usr/local/bin/geth`;

const rollbackTerminal = {
  label: IN_TERMINAL,
  before:
    "Stop the node with Ctrl-C, and wait for `Blockchain stopped`. Then put the old binary back:",
  code: restoreUnix,
  more: [
    { before: "Start it again with its other flags, and no `--mess`:", code: "geth --classic" },
  ],
};

const rollbackLinux: PanelStep = {
  title: rollbackTitle,
  before: swapsBinary,
  choose: RUNS,
  variants: [
    rollbackTerminal,
    {
      label: SYSTEMD,
      before: "Take `--mess` or `--mess=false` out of the unit's `ExecStart` line:",
      code: "sudoedit /etc/systemd/system/core-geth.service",
      more: [
        {
          before:
            "Save the file and close the editor. Then stop the service, put the old binary back, and start it again:",
          code: `sudo systemctl stop core-geth &&
  ${restoreUnix} &&
  sudo systemctl daemon-reload &&
  sudo systemctl start core-geth`,
        },
      ],
    },
  ],
  then: rollbackAfter("$(date +%F)"),
};

// The run guide's agent, which TextEdit opens as the plain text it is.
const agentFile = "~/Library/LaunchAgents/com.coregeth.classic.plist";

const rollbackMacos: PanelStep = {
  title: rollbackTitle,
  before: swapsBinary,
  choose: RUNS,
  variants: [
    rollbackTerminal,
    {
      label: LAUNCHD,
      before: "Unload the agent, which stops the node, and put the old binary back:",
      code: `${agentStop}
${restoreUnix}`,
      more: [
        {
          before: "Take `--mess` or `--mess=false` out of the agent's `ProgramArguments`:",
          code: `open -e ${agentFile}`,
        },
        { before: "Save the file and close TextEdit, then start the agent:", code: agentStart },
      ],
    },
  ],
  then: rollbackAfter("$(date +%F)"),
};

const startupEdit = `$startup = [Environment]::GetFolderPath('Startup')
notepad "$startup\\core-geth-classic.cmd"`;

const rollbackWindows: PanelStep = {
  title: rollbackTitle,
  before: `${swapsBinary} Stop the node with Ctrl+C in its window. Then, in PowerShell, in the folder that holds the node's \`geth.exe\`, put the old binary back:`,
  code: `Remove-Item .\\geth.exe
Rename-Item .\\geth-${EXPOSED_LINE}.exe geth.exe`,
  choose: RUNS,
  variants: [
    {
      label: IN_WINDOW,
      before: "Start it again with its other flags, and no `--mess`:",
      code: ".\\geth.exe --classic",
    },
    {
      label: STARTUP,
      before: "Take `--mess` or `--mess=false` out of the node's command file:",
      code: startupEdit,
      more: [
        { before: "Save the file and close Notepad, then start the node:", code: startupStart },
      ],
    },
  ],
  then: rollbackAfter("$(Get-Date -Format yyyy-MM-dd)"),
};

const stableFirst = `Once the node has caught up, holds peers, and has run on the \`${RECOMMENDED_LINE}\` line long enough that you will not roll back`;
const oldCopy = `Every \`${EXPOSED_LINE}\` release carries the flaws the audits found, so a copy left on the machine is one a later mistake can start.`;

const removeOldUnix = {
  title: removeOldTitle,
  before: `${stableFirst}:`,
  code: `sudo rm /usr/local/bin/geth-${EXPOSED_LINE}`,
  after: `${oldCopy} If you installed over a \`geth\` at another path, delete the \`geth-${EXPOSED_LINE}\` beside it instead.`,
};

const removeOldWindows = {
  title: removeOldTitle,
  before: `${stableFirst}, in PowerShell, in the folder that holds the node's \`geth.exe\`:`,
  code: `Remove-Item .\\geth-${EXPOSED_LINE}.exe`,
  after: oldCopy,
};

// A node the systemd service runs keeps its data in `/var/lib/core-geth`, owned by `geth`, so its steps
// run as `geth` there. The service is the one the install tabs and the documentation's Linux run guide
// set up; a unit of a reader's own takes its own name, user and data directory in the same commands.
const unitLead = `For the systemd service that [${GUIDE_PAGES.install.title}](${GUIDE_PAGES.install.href}) and the documentation's [Linux run guide](${RUN_LINUX}) set up: the \`core-geth\` unit, run as the \`geth\` user, with its data in \`/var/lib/core-geth\`. For a unit of your own, use its name, user and data directory:`;

const IPC_LINUX = "~/.ethereum/classic/geth.ipc";
const IPC_MACOS = "~/Library/Ethereum/classic/geth.ipc";
const IPC_WINDOWS = "\\\\.\\pipe\\geth.ipc";

const unixDownload = (sum: string) => (token: string) =>
  `curl -LO ${assetBase}/core-geth-${token}-${releaseTag}.zip
curl -LO ${assetBase}/core-geth-${token}-${releaseTag}.zip.sha256
${sum} core-geth-${token}-${releaseTag}.zip.sha256`;

const unixInstallRelease = (token: string) => `unzip -o core-geth-${token}-${releaseTag}.zip &&
  { test -e /usr/local/bin/geth-${EXPOSED_LINE} || sudo mv /usr/local/bin/geth /usr/local/bin/geth-${EXPOSED_LINE}; } &&
  sudo install -m 0755 geth /usr/local/bin/geth &&
  geth version`;

const installRelease = (cpus: readonly { label: string; token: string }[]): PanelStep => ({
  title: "Install the release",
  before: sameCpu,
  choose: CPU,
  variants: cpus.map(({ label, token }) => ({ label, code: unixInstallRelease(token) })),
  then: `Go on only if \`geth version\` reports a \`${RECOMMENDED_LINE}\` release. ${keepBinary} ${binaryPath}`,
});

const recordLinux: PanelStep = {
  title: "Record the node's block number and ID",
  choose: RUNS,
  variants: [
    {
      label: IN_TERMINAL,
      code: `geth attach --exec 'eth.blockNumber' ${IPC_LINUX}
geth attach --exec 'admin.nodeInfo.enode' ${IPC_LINUX}`,
      after:
        "These commands use the default data directory. For Mordor, use `~/.ethereum/mordor`; if you pass `--datadir`, use yours.",
    },
    {
      label: SYSTEMD,
      before: unitLead,
      code: `${asGeth("eth.blockNumber")}
  ${asGeth("admin.nodeInfo.enode", true)}`,
    },
  ],
  then: keepId,
};

const stopLinux: PanelStep = {
  title: "Stop the node cleanly",
  choose: RUNS,
  variants: [
    { label: IN_TERMINAL, before: "Press Ctrl-C once in the node's terminal and wait." },
    {
      label: SYSTEMD,
      before:
        "Stop the service, then read the end of its log, which says `Blockchain stopped` after a clean stop:",
      code: "sudo systemctl stop core-geth && sudo journalctl -u core-geth -n 50 --no-pager | grep 'Blockchain stopped'",
    },
  ],
  then: cleanStop,
};

const renameLinux: PanelStep = {
  title: "Rename the old P2P node key",
  choose: RUNS,
  variants: [
    {
      label: IN_TERMINAL,
      code: "mv -n ~/.ethereum/classic/geth/nodekey ~/.ethereum/classic/geth/nodekey.old-rotated-$(date +%F)",
    },
    {
      label: SYSTEMD,
      before: "The key belongs to `geth`:",
      code: "sudo -u geth mv -n /var/lib/core-geth/geth/nodekey /var/lib/core-geth/geth/nodekey.old-rotated-$(date +%F)",
    },
  ],
  then: rotationRequired,
};

const startMoveLinux: PanelStep = {
  title: "Start the node",
  choose: RUNS,
  variants: [
    {
      label: IN_TERMINAL,
      before: startFlags,
      code: "geth --classic",
      after:
        "The node runs in this terminal until you stop it, so run the next steps in a second terminal. For Mordor, use `--mordor` in place of `--classic`.",
    },
    {
      label: SYSTEMD,
      before:
        "Put the flags you just checked at the end of the unit's `ExecStart` line, `--mess` or `--mess=false` among them. This opens the unit in an editor:",
      code: "sudoedit /etc/systemd/system/core-geth.service",
      more: [
        {
          before: "Save the file and close the editor, then reload the unit and start it:",
          code: "sudo systemctl daemon-reload && sudo systemctl start core-geth",
          after: "The reload picks up any flag you changed in the unit.",
        },
      ],
    },
  ],
};

const confirmLines = (attach: string, ipc: string) => `${attach} --exec 'admin.nodeInfo.name' ${ipc}
${attach} --exec 'admin.nodeInfo.enode' ${ipc}
${attach} --exec 'net.peerCount' ${ipc}
${attach} --exec 'eth.blockNumber' ${ipc}`;

// The Source tabs check the running node against what their own build printed, and the others against the
// recommended line.
const confirmLinux = (version?: string): PanelStep => ({
  title: "Confirm the move",
  choose: RUNS,
  variants: [
    { label: IN_TERMINAL, code: confirmLines("geth attach", IPC_LINUX) },
    {
      label: SYSTEMD,
      code: `${asGeth("admin.nodeInfo.name")}
  ${asGeth("admin.nodeInfo.enode")}
  ${asGeth("net.peerCount")}
  ${asGeth("eth.blockNumber", true)}`,
    },
  ],
  then: confirmNote(version),
});

const confirmUnix = (ipc: string, version?: string): PanelStep => ({
  title: "Confirm the move",
  code: confirmLines("geth attach", ipc),
  after: confirmNote(version),
});

const confirmWindows = (version?: string): PanelStep => ({
  title: "Confirm the move",
  code: confirmLines(".\\geth.exe attach", IPC_WINDOWS),
  after: confirmNote(version),
});

const stopMacos: PanelStep = {
  title: "Stop the node cleanly",
  choose: RUNS,
  variants: [
    { label: IN_TERMINAL, before: "Press Ctrl-C once in the node's terminal and wait." },
    {
      label: LAUNCHD,
      before:
        "Unload the agent, which sends the node SIGTERM, then follow its log until it ends with `Blockchain stopped`. Ctrl-C stops following the log:",
      code: `${agentStop}
tail -f ~/Library/Logs/core-geth-$NETWORK.log`,
      after: "For Mordor, set `NETWORK` to `mordor`. The agent loads again at your next login.",
    },
  ],
  then: cleanStop,
};

const startMoveMacos: PanelStep = {
  title: "Start the node",
  choose: RUNS,
  variants: [
    {
      label: IN_TERMINAL,
      before: `In a terminal. ${startFlags}`,
      code: "geth --classic",
      after:
        "The node runs in this terminal until you stop it, so run the next steps in a second terminal. For Mordor, use `--mordor` in place of `--classic`.",
    },
    {
      label: LAUNCHD,
      before:
        "Add the flags you just checked to the agent's `ProgramArguments`, `--mess` or `--mess=false` among them, each as a `<string>` line of its own after `<string>--classic</string>`, joining a flag to its value with `=`. This opens the run guide's agent in TextEdit:",
      code: `open -e ${agentFile}`,
      more: [
        { before: "Save the file and close TextEdit, then start the agent:", code: agentStart },
      ],
    },
  ],
};

const startMoveWindows: PanelStep = {
  title: "Start the node",
  choose: RUNS,
  variants: [
    {
      label: IN_WINDOW,
      before: `In PowerShell, in the folder that holds the node's \`geth.exe\`. ${startFlags}`,
      code: ".\\geth.exe --classic",
      after:
        "The node runs in this window until you stop it, so run the next steps in a second PowerShell window, in the same folder. For Mordor, use `--mordor` in place of `--classic`.",
    },
    {
      label: STARTUP,
      before:
        "Put the flags you just checked after `--classic` on the `geth.exe` line of the node's command file, `--mess` or `--mess=false` among them. This opens the run guide's file in Notepad:",
      code: startupEdit,
      more: [
        { before: "Save the file and close Notepad, then start the node:", code: startupStart },
      ],
    },
  ],
};

// A container whose data is in a volume or a host directory keeps it when the container is replaced; one
// whose data sits in its own layer has it copied out first, because neither image declares a volume.
const MOUNTED = "In a volume or host folder";
const INSIDE = "Inside the container";
const WHERE = "Choose where the container keeps its data";

const replaceBlock = (data: string) => `docker rename core-geth core-geth-${EXPOSED_LINE}
docker update --restart no core-geth-${EXPOSED_LINE}
docker run -d --name core-geth \\
  --restart unless-stopped --stop-timeout 300 \\
  ${data} \\
  -p 30303:30303 -p 30303:30303/udp -p 127.0.0.1:8545:8545 \\
  ghcr.io/${REPO.slug}:latest \\
  --classic --http --http.addr 0.0.0.0 --http.port 8545`;

// Moving a node off the exposed line, on `/downloads/` and the migration guide.
//
// One panel per platform, in the order of the documentation's migration guides, except that the download comes first, so
// the node keeps running until the new release is in hand and checked. The blocks are separate on
// purpose: a pasted block carries on past a failed line, so the rename that rotates the key stands
// alone and the start has a block of its own, which a failed rename cannot reach. `&&` holds the
// install lines together for the same reason, and because a `sudo` line can swallow the lines still
// waiting in a paste. No block carries a comment, except in PowerShell, because stock zsh, the macOS
// default, treats `#` in a paste as a command or an argument.
//
// Every command is the one that platform's migration guide in the documentation gives, apart from what keeps a paste safe
// and the rollback intact. `mv -n` keeps a second paste from overwriting the old key, and the install
// saves the old binary only once, so the block can run again after a mistake. The source panel clones
// `main` with the install tab's block, which stops at an old clone rather than rebuilding it. The
// containers panel renames the key from a throwaway container and gives the new container the old
// one's volumes, which needs no `sudo` and no host path, and it keeps the old container to roll back
// to. "Confirm the move" reads the release from the running node, because `geth version` reads the
// binary on `PATH`, which need not be the binary a unit starts. Every console line that carries an
// enode wraps it in single quotes inside double quotes, the one form PowerShell 5.1 passes to a native
// program unchanged.
export const MOVE_PANELS: readonly PlatformPanel[] = [
  {
    id: "linux",
    label: "Linux",
    steps: [
      trialNode,
      linuxSudo,
      linuxFetchTools("The node can keep running for this step. "),
      {
        title: "Download the release and check it",
        before: `The node can keep running for this step. ${linuxUname}`,
        choose: CPU,
        variants: LINUX_CPUS.map(({ label, token }) => ({
          label,
          code: unixDownload("sha256sum -c")(token),
        })),
        then: `\`sha256sum -c\` must print \`OK\`: if it prints \`FAILED\`, delete the file and download it again rather than running it. ${verifyPointer}`,
      },
      recordLinux,
      stopLinux,
      installRelease(LINUX_CPUS),
      renameLinux,
      staticPeersStep("linux"),
      checkFlags,
      startMoveLinux,
      confirmLinux(),
      otherNodesStep("geth attach", IPC_LINUX),
      rollbackLinux,
      removeOldUnix,
    ],
    guide: { label: "Linux users guide", href: `${DOCS_URL}tutorials/migration/linux/` },
  },
  {
    id: "macos",
    label: "macOS",
    steps: [
      trialNode,
      {
        title: "Download the release and check it",
        before: `The node can keep running for this step. ${macUname}`,
        choose: CPU,
        variants: MAC_CPUS.map(({ label, token }) => ({
          label,
          code: unixDownload("shasum -a 256 -c")(token),
        })),
        then: `\`shasum -a 256 -c\` must print \`OK\`: if it prints \`FAILED\`, delete the file and download it again rather than running it. ${verifyPointer}`,
      },
      {
        title: "Record the node's block number and ID",
        code: `geth attach --exec 'eth.blockNumber' ${IPC_MACOS}
geth attach --exec 'admin.nodeInfo.enode' ${IPC_MACOS}`,
        after: `${keepId} These commands use the default data directory, which the run guide's launchd agent uses too. For Mordor, use \`~/Library/Ethereum/mordor\`; if you pass \`--datadir\`, use yours.`,
      },
      stopMacos,
      installRelease(MAC_CPUS),
      {
        title: "Rename the old P2P node key",
        code: "mv -n ~/Library/Ethereum/classic/geth/nodekey ~/Library/Ethereum/classic/geth/nodekey.old-rotated-$(date +%F)",
        after: rotationRequired,
      },
      staticPeersStep("macos"),
      checkFlags,
      startMoveMacos,
      confirmUnix(IPC_MACOS),
      otherNodesStep("geth attach", IPC_MACOS),
      rollbackMacos,
      removeOldUnix,
    ],
    guide: { label: "macOS users guide", href: `${DOCS_URL}tutorials/migration/macos/` },
  },
  {
    id: "windows",
    label: "Windows",
    steps: [
      trialNode,
      {
        title: "Download the release and check it",
        code: `# In PowerShell, in the folder that holds your current geth.exe
Invoke-WebRequest "${assetBase}/core-geth-win64-${releaseTag}.zip" -OutFile "core-geth-win64-${releaseTag}.zip"
Invoke-WebRequest "${assetBase}/core-geth-win64-${releaseTag}.zip.sha256" -OutFile "core-geth-win64-${releaseTag}.zip.sha256"

# Compare these two lines
(Get-FileHash "core-geth-win64-${releaseTag}.zip" -Algorithm SHA256).Hash
Get-Content "core-geth-win64-${releaseTag}.zip.sha256"`,
        after: `The node can keep running for this step. ${windowsCompare} If they differ, delete the file and download it again rather than running it. ${verifyPointer}`,
      },
      {
        title: "Record the node's block number and ID",
        code: `.\\geth.exe attach --exec 'eth.blockNumber' ${IPC_WINDOWS}
.\\geth.exe attach --exec 'admin.nodeInfo.enode' ${IPC_WINDOWS}`,
        after: keepId,
      },
      {
        title: "Stop the node cleanly",
        after: `Press Ctrl+C once in the node's console window and wait. A window opened from the Startup folder then asks \`Terminate batch job (Y/N)?\`; type \`Y\`. Under a service wrapper, stop it with that tool. ${cleanStop}`,
      },
      {
        title: "Install the release",
        code: `Rename-Item .\\geth.exe geth-${EXPOSED_LINE}.exe
Expand-Archive "core-geth-win64-${releaseTag}.zip" -DestinationPath . -Force
.\\geth.exe version`,
        after: `Go on only if \`.\\geth.exe version\` reports a \`${RECOMMENDED_LINE}\` release. \`geth-${EXPOSED_LINE}.exe\` is the old binary, kept so you can roll back.`,
      },
      {
        title: "Rename the old P2P node key",
        code: `$key = "$env:LOCALAPPDATA\\Ethereum\\classic\\geth\\nodekey"
Rename-Item $key "nodekey.old-rotated-$(Get-Date -Format yyyy-MM-dd)"`,
        after: `${rotationRequired} The commands use the default data directory, but the node uses \`%USERPROFILE%\\AppData\\Roaming\\Ethereum\\classic\` instead if an older \`AppData\\Roaming\\Ethereum\` folder exists and is not empty. For Mordor, use \`mordor\` in place of \`classic\`; if you pass \`--datadir\`, use yours.`,
      },
      staticPeersStep("windows"),
      checkFlags,
      startMoveWindows,
      confirmWindows(),
      otherNodesStep(".\\geth.exe attach", IPC_WINDOWS),
      rollbackWindows,
      removeOldWindows,
    ],
    guide: { label: "Windows users guide", href: `${DOCS_URL}tutorials/migration/windows/` },
  },
  {
    id: "containers",
    label: "Containers",
    steps: [
      trialNode,
      containerStep("pull and run the image", "The node can keep running for this step. "),
      {
        title: "Pull the release",
        code: `docker pull ghcr.io/${REPO.slug}:latest
gh attestation verify oci://ghcr.io/${REPO.slug}:latest --repo ${REPO.slug}`,
        after: `The node can keep running for this step. ${attestationMust("docker-publish.yml", "run the image")} [Verify what you downloaded](/downloads/#verify) checks an image file from the release. A loaded image file carries its release tag and no \`latest\` tag, so put that tag in place of \`latest\` in the steps below, or Docker pulls from the registry instead.`,
      },
      {
        title: "Record the node's block number, ID, restart policy and flags",
        code: `docker exec core-geth geth attach --exec 'eth.blockNumber' /root/.ethereum/classic/geth.ipc
docker exec core-geth geth attach --exec 'admin.nodeInfo.enode' /root/.ethereum/classic/geth.ipc
docker inspect core-geth --format '{{.HostConfig.RestartPolicy.Name}}'
docker inspect core-geth --format '{{json .Args}} {{json .Config.Env}}'`,
        after: `${keepId} The third line prints the container's restart policy, which the rollback puts back, and the last its flags and environment, which the new container takes. These commands use a container named \`core-geth\` with its data at \`/root\`, so put your own name in its place. For Mordor, use \`.ethereum/mordor\` in the paths.`,
      },
      // A container started without `-v` keeps the chain in its own layer, because neither image
      // declares a volume, and `--volumes-from` does not reach it: the rename fails and the new
      // container starts empty. So the data's place is checked while the node runs, and the steps that
      // touch the data offer a tab for each place.
      {
        title: "Check where the container keeps its data",
        code: "docker inspect core-geth --format '{{range .Mounts}}{{.Destination}} {{end}}'",
        after: `This prints \`/root\`, or \`/root/.ethereum\`, when the data is in a host directory or a named volume, which the steps below carry to the new container. If it prints neither, the data is inside the container itself: take the "${INSIDE}" tab in the steps below, or the new container starts with no chain and resyncs.`,
      },
      {
        title: "Stop the node cleanly",
        code: `docker stop -t 300 core-geth
docker logs --tail 50 core-geth 2>&1 | grep 'Blockchain stopped'`,
        after: `The second command prints \`Blockchain stopped\` after a clean stop. If it prints nothing, the node did not stop cleanly: it recovers at its next start, moving its head back and importing those blocks again ([After an unclean stop](${DOCS_URL}operate/maintenance/#after-an-unclean-stop)), so its block number can start lower than the one you recorded. Use \`-t 300\`: a plain \`docker stop\` kills the node if it has not stopped within 10 seconds.`,
      },
      {
        title: "Rename the old P2P node key",
        choose: WHERE,
        variants: [
          {
            label: MOUNTED,
            before: "If the check printed `/root` or `/root/.ethereum`:",
            code: `docker run --rm --volumes-from core-geth --entrypoint sh ghcr.io/${REPO.slug}:latest \\
  -c "mv -n /root/.ethereum/classic/geth/nodekey /root/.ethereum/classic/geth/nodekey.old-rotated-$(date +%F)"`,
          },
          {
            label: INSIDE,
            before:
              "If the check printed neither, this copies the data out of the stopped container and renames the key in the copy, which needs as much free space as the chain takes:",
            code: `mkdir -p $HOME/core-geth-data &&
  docker cp core-geth:/root/. $HOME/core-geth-data/ &&
  docker run --rm -v $HOME/core-geth-data:/root --entrypoint sh ghcr.io/${REPO.slug}:latest \\
    -c "mv -n /root/.ethereum/classic/geth/nodekey /root/.ethereum/classic/geth/nodekey.old-rotated-$(date +%F)"`,
            after: "The chain comes with the copy, so the node does not resync.",
          },
        ],
        then: rotationRequired,
      },
      staticPeersStep("containers"),
      checkFlags,
      {
        title: "Replace the container",
        before: `Before you run the block, put the flags you recorded in its last line and the \`GETH_\` variables in as \`-e\` options. Keep the old container's two P2P port mappings. The RPC check applies to the published RPC port, which stays on \`127.0.0.1\` even if the old container published it everywhere; \`--http.addr 0.0.0.0\` inside the container reaches only that port. If the old container ran with \`--network host\`, run this one that way too, without the \`-p\` options and with \`--http.addr 127.0.0.1\`.`,
        choose: WHERE,
        variants: [
          { label: MOUNTED, code: replaceBlock(`--volumes-from core-geth-${EXPOSED_LINE}`) },
          {
            label: INSIDE,
            before: "On the copy the rename step made:",
            code: replaceBlock("-v $HOME/core-geth-data:/root"),
          },
        ],
        then: "For Mordor, use `--mordor` in place of `--classic`. The old container stays, stopped, and is what you roll back to.",
      },
      {
        title: "Confirm the move",
        code: `docker exec core-geth geth version
docker exec core-geth geth attach --exec 'admin.nodeInfo.enode' /root/.ethereum/classic/geth.ipc
docker exec core-geth geth attach --exec 'net.peerCount' /root/.ethereum/classic/geth.ipc
docker exec core-geth geth attach --exec 'eth.blockNumber' /root/.ethereum/classic/geth.ipc`,
        after: confirmNote(),
      },
      otherNodesStep(
        "docker exec core-geth geth attach",
        "/root/.ethereum/classic/geth.ipc",
        "",
        " Put that node's container name in place of `core-geth`, which here is the node you just moved. On a node outside a container, run `geth attach` with that node's IPC path, as this section's other tabs show.",
      ),
      {
        title: "If you need to roll back",
        choose: WHERE,
        variants: [
          {
            label: MOUNTED,
            before: "This swaps the new container for the old one, which runs on the same volumes:",
            code: `docker stop -t 300 core-geth &&
  docker rm core-geth &&
  docker rename core-geth-${EXPOSED_LINE} core-geth &&
  docker update --restart unless-stopped core-geth &&
  docker start core-geth`,
          },
          {
            label: INSIDE,
            before: `The old container's own copy of the data still holds the old key, so it does not run again. This removes the new container, and the old one, whose data the copy holds, so that moving again can give the name \`core-geth-${EXPOSED_LINE}\` to this container. It then runs the image the old one used on the copy: put the flags and \`GETH_\` variables you recorded in, as for the new container, without \`--mess\`, which a \`${EXPOSED_LINE}\` binary refuses.`,
            code: `IMAGE=$(docker inspect core-geth-${EXPOSED_LINE} --format '{{.Config.Image}}') &&
  docker stop -t 300 core-geth &&
  docker rm core-geth core-geth-${EXPOSED_LINE} &&
  docker run -d --name core-geth \\
    --restart unless-stopped --stop-timeout 300 \\
    -v $HOME/core-geth-data:/root \\
    -p 30303:30303 -p 30303:30303/udp -p 127.0.0.1:8545:8545 \\
    "$IMAGE" \\
    --classic --http --http.addr 0.0.0.0 --http.port 8545`,
          },
        ],
        then: `Put the restart policy you recorded in place of \`unless-stopped\`. ${rollbackAfter("$(date +%F)")}`,
      },
      {
        title: `Once the node is stable, remove the ${EXPOSED_LINE} container and image`,
        before: `${stableFirst}:`,
        code: `OLD=$(docker inspect core-geth-${EXPOSED_LINE} --format '{{.Config.Image}}') &&
  docker rm core-geth-${EXPOSED_LINE} &&
  docker rmi "$OLD"`,
        after: `${oldCopy} The first line reads which image the old container ran, then the block removes the stopped container and that image. \`docker rm\` leaves the volumes the new container uses. If you copied the data out, the old container's own copy of the data goes with it, and the node runs on the copy. \`docker rmi\` refuses while another container still uses the image.`,
      },
    ],
    guide: { label: "Docker users guide", href: `${DOCS_URL}tutorials/migration/docker/` },
  },
  {
    id: "source",
    label: "Source",
    // Its steps are the build-from-source tabs, MOVE_SOURCE_PANELS, passed through the panel's slot.
    steps: [],
  },
];

// A step from this section's tab for a platform, by title, for the pages that take one of its steps; a
// title that is not there fails the build.
const moveStep = (id: PlatformPanel["id"], title: string) => {
  const step = MOVE_PANELS.find((panel) => panel.id === id)?.steps.find((s) => s.title === title);
  if (!step) throw new Error(`no "${title}" step in this section's ${id} tab`);
  return step;
};

const nodeKeepsRunning = "The node can keep running while you install the tools and build. ";

const buildGoOn = `Go on only if the first line \`geth version\` prints names version ${LINE_VERSION} or later; a build of \`main\` ends it with \`-unstable\`, and two builds a day apart can be different code. Keep the \`Git Commit\` line: "Confirm the move" checks the running node against it.`;

const whyMain = `The Source tab under [Install](/downloads/#${INSTALL_ANCHOR}) says why these steps build \`main\`.`;

const unixMoveBuild: PanelStep = {
  title: "Build the main branch",
  choose: buildChoice,
  variants: [{ label: "First build", code: buildMain, after: firstBuildNote }, buildAgain],
  then: `${buildGoOn} ${whyMain}`,
};

const unixInstallBuild = {
  title: "Install the build",
  code: `ls build/bin/geth &&
  { test -e /usr/local/bin/geth-${EXPOSED_LINE} || sudo mv /usr/local/bin/geth /usr/local/bin/geth-${EXPOSED_LINE}; } &&
  sudo install -m 0755 build/bin/geth /usr/local/bin/geth &&
  geth version`,
  after: `Run this in the folder the build step left you in: the first line stops the block anywhere else. Go on only if \`geth version\` prints the same first line and \`Git Commit\` line it printed after the build. ${keepBinary} ${binaryPath}`,
};

// The build step moves to the home folder before it clones, so the install copies the build from
// `$HOME\core-geth` into the node's folder.
const windowsInstallBuild = {
  title: "Install the build",
  before: "In the same folder:",
  code: `Rename-Item .\\geth.exe geth-${EXPOSED_LINE}.exe
Copy-Item "$HOME\\core-geth\\build\\bin\\geth.exe" .\\geth.exe
.\\geth.exe version`,
  after: `Go on only if \`.\\geth.exe version\` prints the same first line and \`Git Commit\` line the build printed. \`geth-${EXPOSED_LINE}.exe\` is the old binary, kept so you can roll back. The second line copies the build from \`core-geth\` in your home folder, where the build step cloned it.`,
};

const buildVersion =
  "The first line must name the version the build printed, followed by the first eight characters of its `Git Commit`.";

// The build-from-source tabs under moving a node: each platform's tools and build, then that platform's
// move steps above, the same definitions, with the build installed in place of the release.
export const MOVE_SOURCE_PANELS: readonly PlatformPanel[] = [
  {
    id: "linux",
    label: "Linux",
    heading: "Build from source and move the node on Linux",
    steps: [
      trialNode,
      linuxSudo,
      linuxTools(nodeKeepsRunning),
      linuxGo,
      linuxCheck,
      unixMoveBuild,
      recordLinux,
      stopLinux,
      unixInstallBuild,
      renameLinux,
      moveStep("linux", "If this node lists static peers, update the list"),
      checkFlags,
      startMoveLinux,
      confirmLinux(buildVersion),
      moveStep("linux", "If other nodes list this node, give them the new ID"),
      rollbackLinux,
      removeOldUnix,
    ],
    guide: { label: "Linux users guide", href: `${DOCS_URL}tutorials/migration/linux/` },
  },
  {
    id: "macos",
    label: "macOS",
    heading: "Build from source and move the node on macOS",
    steps: [
      trialNode,
      macosTools(nodeKeepsRunning),
      macosGo,
      macosCheck,
      unixMoveBuild,
      moveStep("macos", "Record the node's block number and ID"),
      stopMacos,
      unixInstallBuild,
      moveStep("macos", "Rename the old P2P node key"),
      moveStep("macos", "If this node lists static peers, update the list"),
      checkFlags,
      startMoveMacos,
      confirmUnix(IPC_MACOS, buildVersion),
      moveStep("macos", "If other nodes list this node, give them the new ID"),
      rollbackMacos,
      removeOldUnix,
    ],
    guide: { label: "macOS users guide", href: `${DOCS_URL}tutorials/migration/macos/` },
  },
  {
    id: "windows",
    label: "Windows",
    heading: "Build from source and move the node on Windows",
    steps: [
      trialNode,
      windowsChocolateyCheck(nodeKeepsRunning),
      windowsChocolateyInstall,
      windowsChocolateyV1,
      windowsTools,
      windowsGoDownload,
      windowsGoInstall,
      windowsCheck,
      {
        title: "Build the main branch",
        choose: buildChoice,
        variants: [
          {
            label: "First build",
            before: "In PowerShell, one line at a time:",
            code: windowsBuild,
            after:
              "If `git clone` reports that `core-geth` already exists, take Build again instead.",
          },
          buildAgainWindows,
        ],
        then: `${buildGoOn} ${whyMain}`,
      },
      {
        ...moveStep("windows", "Record the node's block number and ID"),
        before:
          "In PowerShell, in the folder that holds the node's `geth.exe`, such as `C:\\core-geth`:",
      },
      moveStep("windows", "Stop the node cleanly"),
      windowsInstallBuild,
      moveStep("windows", "Rename the old P2P node key"),
      moveStep("windows", "If this node lists static peers, update the list"),
      checkFlags,
      startMoveWindows,
      confirmWindows(buildVersion),
      moveStep("windows", "If other nodes list this node, give them the new ID"),
      rollbackWindows,
      removeOldWindows,
    ],
    guide: { label: "Windows users guide", href: `${DOCS_URL}tutorials/migration/windows/` },
  },
];

export const moveLede = `${MOVE_RECOMMENDATION} ${UPGRADE_COST} ${BELOW_FLOOR_POINTER} Follow the steps for your platform below rather than the install steps at the top of this page, which start a node before its P2P node key changes. These steps keep your old binary or container so you can roll back while you find what went wrong, rotate the key before the node starts again, and end by deleting the old binary once the node is stable. The rotation is required: one of the flaws in the \`${EXPOSED_LINE}\` line leaks bits of the P2P node key across repeated handshakes, and no fix can take back what already leaked.`;

export const moveNote = `The documentation's [migration guide](${DOCS.migration.href}) also says what else names this node.`;

// A `v1.12` node that cannot move yet takes the peer discovery the recommended line ships, its lists and
// its bootnodes both, and a config file loses the `v1.12` values (maintainer, 2026-11-08). Both come from
// `main`'s params files at build time. `--discovery.dns` replaces the release's lists and `--bootnodes`
// its bootnodes, as `ethereumclassic/discv4-dns-lists`' "Using the trees" says; in the `v1.12` source,
// `--bootnodes` also outranks a file's `BootstrapNodes` and sets the discovery v5 bootnodes, which a
// `--classic` or `--mordor` flag otherwise sets to the release's own. `--discovery.dns` sets only
// `EthDiscoveryURLs`, so a node started from a file has both list lines changed there instead.
const discovery = await getDiscovery();

const listsFlag = (n: NetworkDiscovery) => `--discovery.dns "${n.lists.join(",")}"`;
const bootnodesFlag = (n: NetworkDiscovery) => `--bootnodes "${n.bootnodes.join(",")}"`;

type Network = "classic" | "mordor";

/** A start line that reads the recommended line's lists and bootnodes, one flag to a line. */
const startLine = (network: Network) => `geth --${network} \\
  ${listsFlag(discovery[network])} \\
  ${bootnodesFlag(discovery[network])}`;

/** The same on one line for PowerShell, which a trailing backslash does not continue. */
const startLineWindows = (network: Network) =>
  `.\\geth.exe --${network} ${listsFlag(discovery[network])} ${bootnodesFlag(discovery[network])}`;

/** The two flags on one line, for a unit's `ExecStart` line or a Windows command file. */
const flagsLine = (network: Network) =>
  `${listsFlag(discovery[network])} ${bootnodesFlag(discovery[network])}`;

/** The two flags as launchd takes them, each a `<string>` of its own with its value joined by `=`. */
const agentFlags = (network: Network) =>
  `<string>--discovery.dns=${discovery[network].lists.join(",")}</string>
<string>--bootnodes=${discovery[network].bootnodes.join(",")}</string>`;

/** The old container's replacement, from the same image, on its data. */
const containerReplace = (network: Network, data: string) =>
  `IMAGE=$(docker inspect core-geth --format '{{.Config.Image}}') &&
  docker rename core-geth core-geth-old &&
  docker update --restart no core-geth-old &&
  docker run -d --name core-geth \\
    --restart unless-stopped --stop-timeout 300 \\
    ${data} \\
    -p 30303:30303 -p 30303:30303/udp -p 127.0.0.1:8545:8545 \\
    "$IMAGE" \\
    --${network} --http --http.addr 0.0.0.0 --http.port 8545 \\
    ${listsFlag(discovery[network])} \\
    ${bootnodesFlag(discovery[network])}`;

// "Using the trees" sets a file's lists one to a line, with a trailing comma.
const fileLists = (n: NetworkDiscovery) => {
  const values = n.lists.map((list) => `  "${list}",`).join("\n");
  return `[Eth]
EthDiscoveryURLs = [
${values}
]
SnapDiscoveryURLs = [
${values}
]`;
};

const startTitle = `Start it with the ${RECOMMENDED_LINE} line's lists and bootnodes`;
const replaceTitle = `Replace the container with one that reads the ${RECOMMENDED_LINE} line's lists and bootnodes`;
const mordorTitle = "On Mordor, use Mordor's lists and bootnodes instead";

const listsInPlace = `The node then reads these three lists in place of the one its release reads, and starts from the \`${RECOMMENDED_LINE}\` line's bootnodes in place of its own. It needs no working bootnode to use the lists, because it dials the nodes in them directly.`;

const alreadyHas = (where: string) =>
  `If ${where} already has \`--discovery.dns\` or \`--bootnodes\`, put these values in place of theirs. If you updated a config file, leave out \`--discovery.dns\` and its value.`;

const otherFlags =
  "with the node's other flags added to this line: a node on `--datadir` that runs it as it stands starts an empty chain in the default directory.";

const recordNote = (paths = "") =>
  `Keep what this prints: "Confirm the node holds peers" compares the block number with it.${paths ? ` ${paths}` : ""}`;

const configFileStep = (extra = "") => ({
  title: "If the node starts from a config file, update it",
  before:
    "If the node starts with `--config`, edit that file while the node is down. Under `[Eth]`, put the three lists in place of the values of these two lines:",
  code: fileLists(discovery.classic),
  after: `Under \`[Node.P2P]\`, delete any \`BootstrapNodes\` and \`BootstrapNodesV5\` lines: they hold the \`${EXPOSED_LINE}\` release's bootnodes, and the \`--bootnodes\` flag in the next step takes their place. Leave \`--discovery.dns\` off the start line: it sets only \`EthDiscoveryURLs\`, and the file now sets both. For Mordor, use the three \`all.mordor.\` lists. [Using the trees](${LISTS_REPO.trees}#core-geth-v112-line) shows the same file.${extra}`,
});

const peersNote = `If an attach line cannot connect, wait a minute and run it again. The peer count climbs within minutes. If it is still zero after five minutes, see [Why does the node have no peers?](${DOCS_URL}operate/troubleshooting/#why-does-the-node-have-no-peers), and if the lists and bootnodes have gone dark, [start it once from the node records](${DARK_LISTS}). The block number starts near the one you recorded, or lower after an unclean stop, and climbs to the network's head.`;

const peerLines = (attach: string, ipc: string) => `${attach} --exec 'net.peerCount' ${ipc}
${attach} --exec 'eth.blockNumber' ${ipc}`;

const confirmPeers = (attach: string, ipc: string, before: string, extra = "") => ({
  title: "Confirm the node holds peers",
  before,
  code: peerLines(attach, ipc),
  after: `${peersNote}${extra}`,
});

// The unit's `ExecStart` line takes the two flags on one line, after the flags it has.
const unitFlags = (network: Network, unit: string): StepVariant => ({
  label: SYSTEMD,
  before: `This opens the unit in an editor, \`${unit}\` for the run guide's:`,
  code: `sudoedit /etc/systemd/system/${unit}`,
  more: [
    {
      before:
        "Put these two flags and their values at the end of its `ExecStart` line, on that one line:",
      code: flagsLine(network),
    },
    {
      before: "Save the file and close the editor, then reload the unit and start it:",
      code: `sudo systemctl daemon-reload && sudo systemctl start ${unit.replace(/\.service$/, "")}`,
    },
  ],
});

// The agent's `ProgramArguments` take the two flags as launchd takes every flag.
const agentDiscovery = (network: Network): StepVariant => ({
  label: LAUNCHD,
  before: `This opens the run guide's agent in TextEdit, \`com.coregeth.${network}.plist\`:`,
  code: `open -e ~/Library/LaunchAgents/com.coregeth.${network}.plist`,
  more: [
    {
      before: `Put these two lines after \`<string>--${network}</string>\` in its \`ProgramArguments\`:`,
      code: agentFlags(network),
    },
    {
      before: "Save the file and close TextEdit, then start the agent:",
      code: `NETWORK=${network}
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.coregeth.$NETWORK.plist`,
    },
  ],
});

// The Startup folder's command file takes the two flags after the network flag, on the `geth.exe` line.
const startupDiscovery = (network: Network): StepVariant => ({
  label: STARTUP,
  before: `This opens the node's command file in Notepad, \`core-geth-${network}.cmd\` for the run guide's:`,
  code: `$startup = [Environment]::GetFolderPath('Startup')
notepad "$startup\\core-geth-${network}.cmd"`,
  more: [
    {
      before: `Put these after \`--${network}\` on its \`geth.exe\` line:`,
      code: flagsLine(network),
    },
    {
      before: "Save the file and close Notepad, then start the node:",
      code: `$startup = [Environment]::GetFolderPath('Startup')
Start-Process "$startup\\core-geth-${network}.cmd"`,
    },
  ],
});

const discoveryUnitLead = `For the systemd service the documentation's [Linux run guide](${RUN_LINUX}) sets up: the \`core-geth\` unit, run as the \`geth\` user, with its data in \`/var/lib/core-geth\`. For a unit of your own, use its name, user and data directory:`;

// Pointing a node that cannot move yet at the recommended line's lists and bootnodes, on each platform. A
// node built from source starts the same way as its platform's download, so there is no Source tab.
export const DISCOVERY_PANELS: readonly PlatformPanel[] = [
  {
    id: "linux",
    label: "Linux",
    steps: [
      {
        title: "Record the node's block number",
        choose: RUNS,
        variants: [
          {
            label: IN_TERMINAL,
            code: `geth attach --exec 'eth.blockNumber' ${IPC_LINUX}`,
            after:
              "The command uses the default data directory. For Mordor, use `~/.ethereum/mordor`; if you pass `--datadir`, use yours.",
          },
          { label: SYSTEMD, before: discoveryUnitLead, code: asGeth("eth.blockNumber", true) },
        ],
        then: recordNote(),
      },
      stopLinux,
      configFileStep(),
      {
        title: startTitle,
        choose: RUNS,
        variants: [
          {
            label: IN_TERMINAL,
            before: `From a terminal, ${otherFlags}`,
            code: startLine("classic"),
          },
          unitFlags("classic", "core-geth.service"),
        ],
        then: `${alreadyHas("the start command")} ${listsInPlace}`,
      },
      {
        title: mordorTitle,
        before: "Mordor, Ethereum Classic's test network, has lists and bootnodes of its own:",
        choose: RUNS,
        variants: [
          { label: IN_TERMINAL, code: startLine("mordor") },
          unitFlags("mordor", "core-geth-mordor.service"),
        ],
        then: `The notes under "${startTitle}" apply to this one too.`,
      },
      {
        title: "Confirm the node holds peers",
        choose: RUNS,
        variants: [
          {
            label: IN_TERMINAL,
            before: "In another terminal:",
            code: peerLines("geth attach", IPC_LINUX),
          },
          {
            label: SYSTEMD,
            before: "In another terminal, as `geth`:",
            code: `${asGeth("net.peerCount")}
  ${asGeth("eth.blockNumber", true)}`,
          },
        ],
        then: peersNote,
      },
    ],
  },
  {
    id: "macos",
    label: "macOS",
    steps: [
      {
        title: "Record the node's block number",
        code: `geth attach --exec 'eth.blockNumber' ${IPC_MACOS}`,
        after: recordNote(
          "The command uses the default data directory, which the run guide's launchd agent uses too. For Mordor, use `~/Library/Ethereum/mordor`; if you pass `--datadir`, use yours.",
        ),
      },
      stopMacos,
      configFileStep(),
      {
        title: startTitle,
        choose: RUNS,
        variants: [
          {
            label: IN_TERMINAL,
            before: `From a terminal, ${otherFlags}`,
            code: startLine("classic"),
          },
          agentDiscovery("classic"),
        ],
        then: `${alreadyHas("the start command")} ${listsInPlace}`,
      },
      {
        title: mordorTitle,
        before: "Mordor, Ethereum Classic's test network, has lists and bootnodes of its own:",
        choose: RUNS,
        variants: [{ label: IN_TERMINAL, code: startLine("mordor") }, agentDiscovery("mordor")],
        then: `The notes under "${startTitle}" apply to this one too.`,
      },
      confirmPeers("geth attach", IPC_MACOS, "In another terminal:"),
    ],
  },
  {
    id: "windows",
    label: "Windows",
    steps: [
      {
        title: "Record the node's block number",
        before: "In PowerShell, in the folder that holds the node's `geth.exe`:",
        code: `.\\geth.exe attach --exec 'eth.blockNumber' ${IPC_WINDOWS}`,
        after: recordNote(),
      },
      moveStep("windows", "Stop the node cleanly"),
      configFileStep(
        " Save the file as UTF-8 with no byte order mark, which in Notepad is the encoding UTF-8, not UTF-8 with BOM. A byte order mark, or UTF-16, stops the start with `invalid TOML syntax`.",
      ),
      {
        title: startTitle,
        choose: RUNS,
        variants: [
          {
            label: IN_WINDOW,
            before: `In PowerShell, in the folder that holds the node's \`geth.exe\`, ${otherFlags}`,
            code: startLineWindows("classic"),
          },
          startupDiscovery("classic"),
        ],
        then: `${alreadyHas("the start command")} ${listsInPlace}`,
      },
      {
        title: mordorTitle,
        before: "Mordor, Ethereum Classic's test network, has lists and bootnodes of its own:",
        choose: RUNS,
        variants: [
          { label: IN_WINDOW, code: startLineWindows("mordor") },
          startupDiscovery("mordor"),
        ],
        then: `The notes under "${startTitle}" apply to this one too.`,
      },
      confirmPeers(
        ".\\geth.exe attach",
        IPC_WINDOWS,
        "In a second PowerShell window, in the same folder:",
      ),
    ],
  },
  {
    id: "containers",
    label: "Containers",
    steps: [
      {
        title: "Record the node's block number, image, restart policy and flags",
        before: posixShell,
        code: `docker exec core-geth geth attach --exec 'eth.blockNumber' /root/.ethereum/classic/geth.ipc
docker inspect core-geth --format '{{.Config.Image}}'
docker inspect core-geth --format '{{.HostConfig.RestartPolicy.Name}}'
docker inspect core-geth --format '{{json .Args}} {{json .Config.Env}}'`,
        after: `Keep what these print: "Confirm the node holds peers" compares the block number, the new container runs the same \`${EXPOSED_LINE}\` image, takes the old container's restart policy, and takes its flags and environment. These commands use a container named \`core-geth\` with its data at \`/root\`, so put your own name in its place. For Mordor, use \`.ethereum/mordor\` in the path.`,
      },
      {
        ...moveStep("containers", "Check where the container keeps its data"),
        after: `This prints \`/root\`, or \`/root/.ethereum\`, when the data is in a host directory or a named volume, which the new container takes over. If it prints neither, the data is inside the container itself: after the stop, take the copy step below and the "${INSIDE}" tab in the steps after it, or the new container starts with no chain and resyncs.`,
      },
      moveStep("containers", "Stop the node cleanly"),
      {
        title: "If the data is inside the container, copy it out",
        before:
          "If the check printed neither, run this. It copies the data out of the stopped container, which needs as much free space as the chain takes:",
        code: `mkdir -p $HOME/core-geth-data &&
  docker cp core-geth:/root/. $HOME/core-geth-data/`,
        after: "The chain comes with the copy, so the node does not resync.",
      },
      configFileStep(
        " For a container, edit the file its `--config` names, on the host it is mounted from.",
      ),
      {
        title: replaceTitle,
        before: `A container cannot take a new flag, so this block replaces it with one from the same image, on the same data. Before you run it, put the flags you recorded in its last lines, after \`--classic\`, and the \`GETH_\` variables in as \`-e\` options. Keep its port mappings, and put the restart policy you recorded in place of \`unless-stopped\`. If the old container ran with \`--network host\`, run this one that way too, without the \`-p\` options and with \`--http.addr 127.0.0.1\`.`,
        choose: WHERE,
        variants: [
          { label: MOUNTED, code: containerReplace("classic", "--volumes-from core-geth-old") },
          {
            label: INSIDE,
            before: "On the copy the step above made:",
            code: containerReplace("classic", "-v $HOME/core-geth-data:/root"),
          },
        ],
        then: `${alreadyHas("the old container's command")} ${listsInPlace}`,
      },
      {
        title: "On Mordor, run this block instead",
        before: "Mordor, Ethereum Classic's test network, has lists and bootnodes of its own:",
        choose: WHERE,
        variants: [
          { label: MOUNTED, code: containerReplace("mordor", "--volumes-from core-geth-old") },
          { label: INSIDE, code: containerReplace("mordor", "-v $HOME/core-geth-data:/root") },
        ],
        then: `The notes under "${replaceTitle}" apply to this one too.`,
      },
      confirmPeers(
        "docker exec core-geth geth attach",
        "/root/.ethereum/classic/geth.ipc",
        "For Mordor, use `.ethereum/mordor` in the paths:",
      ),
      {
        title: "Once it holds peers, remove the old container",
        code: "docker rm core-geth-old",
        after:
          "The old container stays, stopped, as `core-geth-old` until you remove it. `docker rm` leaves the volumes the new container uses.",
      },
    ],
  },
];

// The first check in the migration and discovery guides: the running node's name, which carries its release.
// `geth version` reads the binary on `PATH`, which need not be the one running.
const nameTitle = "Ask the running node for its name";

export const NAME_PANELS: readonly PlatformPanel[] = [
  {
    id: "linux",
    label: "Linux",
    steps: [
      {
        title: nameTitle,
        choose: RUNS,
        variants: [
          {
            label: IN_TERMINAL,
            code: `geth attach --exec 'admin.nodeInfo.name' ${IPC_LINUX}`,
            after:
              "This uses the default data directory. For Mordor, use `~/.ethereum/mordor`; if you pass `--datadir`, use yours.",
          },
          { label: SYSTEMD, before: discoveryUnitLead, code: asGeth("admin.nodeInfo.name", true) },
        ],
      },
    ],
  },
  {
    id: "macos",
    label: "macOS",
    steps: [
      {
        title: nameTitle,
        code: `geth attach --exec 'admin.nodeInfo.name' ${IPC_MACOS}`,
        after:
          "This uses the default data directory, which the run guide's launchd agent uses too. For Mordor, use `~/Library/Ethereum/mordor`; if you pass `--datadir`, use yours.",
      },
    ],
  },
  {
    id: "windows",
    label: "Windows",
    steps: [
      {
        title: nameTitle,
        before: "In PowerShell, in the folder that holds the node's `geth.exe`:",
        code: `.\\geth.exe attach --exec 'admin.nodeInfo.name' ${IPC_WINDOWS}`,
      },
    ],
  },
  {
    id: "containers",
    label: "Containers",
    steps: [
      {
        title: nameTitle,
        code: "docker exec core-geth geth attach --exec 'admin.nodeInfo.name' /root/.ethereum/classic/geth.ipc",
        after:
          "This uses a container named `core-geth` with its data at `/root`, so put your own name in its place. For Mordor, use `.ethereum/mordor` in the path.",
      },
    ],
  },
];

// A node that finds no lists and no bootnodes starts once from the node records
// `ethereumclassic/discv4-dns-lists` commits, with the command its "DNS hosting and outages" page gives,
// then starts the usual way again. Windows reads the same records in PowerShell, in a block of its own,
// because PowerShell 5.1 has no `&&` and a check guards only what sits in a later block.
const recordsList = (indent = "  ") => `"$(curl -fsSL ${LISTS_REPO.classicNodes} \\
${indent}| jq -r '[to_entries | sort_by(.value.score, .value.lastResponse) | reverse | .[:20][] | .value.record] | join(",")')"`;

const recordsNote = `It takes up to twenty Ethereum Classic nodes with the highest scores, the ones that have kept answering the nightly crawl, and passes them to the node as bootnodes. Every \`${EXPOSED_LINE}\` and \`${RECOMMENDED_LINE}\` release accepts these \`enr:\` records as bootnodes. The flag replaces the built-in list, and a malformed entry stops the node from starting, so pass the list as the command produces it. Use it for the start that needs it, then take it out: in place of the built-in bootnodes it keeps twenty nodes that age from the day you ran it. On a node that starts with \`--bootnodes\`, as [this guide's steps](${GUIDE_PAGES.discovery.href}#steps) have a \`${EXPOSED_LINE}\` node do, it takes that flag's place for this start. For Mordor, use \`--mordor\`, and \`all.mordor.ethereumclassic.net\` in place of \`all.classic.ethereumclassic.net\` in the address. If GitHub cannot be reached, read the same file from a clone of \`${LISTS_REPO.slug}\`.`;

// The records command reads with curl and picks the records out with jq, which a minimal install can lack.
// jq on a Mac: Homebrew's, or jq's own build from its latest release, checked against the SHA-256 that release
// lists before it is installed, for a Mac without Homebrew. macOS carries curl.
const jqMac = (
  arch: "arm64" | "amd64",
) => `curl -LO https://github.com/jqlang/jq/releases/latest/download/jq-macos-${arch}
curl -LO https://github.com/jqlang/jq/releases/latest/download/sha256sum.txt
grep jq-macos-${arch} sha256sum.txt | shasum -a 256 -c &&
  chmod +x jq-macos-${arch} &&
  sudo mkdir -p /usr/local/bin &&
  sudo mv jq-macos-${arch} /usr/local/bin/jq &&
  jq --version`;

const jqBuildNote =
  "A build from [jq's latest release](https://github.com/jqlang/jq/releases/latest) installs only once `shasum -a 256 -c` prints `OK`: if it prints `FAILED`, delete the file and download it again.";

const jqMacWays: StepVariant[] = [
  { label: "Mac with Homebrew", code: "brew install jq" },
  { label: "Apple Silicon Mac", code: jqMac("arm64") },
  { label: "Intel Mac", code: jqMac("amd64") },
];

const darkInstall = (lead: string, mac = false): PanelStep => ({
  title: "Install curl and jq",
  before: `The node can keep running for this step. ${lead}`,
  choose: mac ? "Choose the host's system" : DISTRO,
  variants: [
    ...distros(
      "sudo apt-get update && sudo apt-get install -y curl jq",
      dnfWithCurl("curl jq"),
      "sudo pacman -Syu --needed curl jq",
      archFull,
      curlMinimal,
    ),
    ...(mac ? jqMacWays : []),
  ],
  then: `Each line also updates the tools if they are already installed.${mac ? ` macOS carries curl. ${jqBuildNote}` : ""}`,
});

const darkCheck = {
  title: "Check that curl and jq are installed",
  code: `curl --version
jq --version`,
  after: "Each line must print a version.",
};

const darkCheckTitle = "Check that it holds peers, then start it the usual way";
const handBack = "Once this prints a number above zero, the node can run on.";
const handBackService = (how: string) =>
  `Once the peer count is above zero, press Ctrl-C once in the node's terminal, wait for \`Blockchain stopped\`, and start the ${how}, which starts it without the records:`;

export const DARK_PANELS: readonly PlatformPanel[] = [
  {
    id: "linux",
    label: "Linux",
    steps: [
      linuxSudo,
      darkInstall("The command reads the records with curl and picks them out with jq:"),
      darkCheck,
      stopLinux,
      {
        title: "Start the node once from the committed records",
        choose: RUNS,
        variants: [
          {
            label: IN_TERMINAL,
            before: `From a terminal, ${otherFlags}`,
            code: `geth --classic --bootnodes ${recordsList()}`,
          },
          {
            label: SYSTEMD,
            before: `A unit cannot run the \`$(...)\` part, so with the unit stopped, run the node from a terminal as the unit's user, with the unit's flags. For the service the documentation's [Linux run guide](${RUN_LINUX}) sets up:`,
            code: `sudo -u geth -H geth --classic --datadir /var/lib/core-geth --bootnodes ${recordsList()}`,
          },
        ],
        then: recordsNote,
      },
      {
        title: darkCheckTitle,
        choose: RUNS,
        variants: [
          {
            label: IN_TERMINAL,
            before: "In another terminal:",
            code: `geth attach --exec 'net.peerCount' ${IPC_LINUX}`,
            after: `${handBack} For Mordor, use \`~/.ethereum/mordor\`; if you pass \`--datadir\`, use yours.`,
          },
          {
            label: SYSTEMD,
            before: "In another terminal, as `geth`:",
            code: asGeth("net.peerCount", true),
            more: [{ before: handBackService("unit"), code: "sudo systemctl start core-geth" }],
          },
        ],
      },
    ],
  },
  {
    id: "macos",
    label: "macOS",
    steps: [
      {
        ...darkCheck,
        before: "The node can keep running for this step. macOS carries curl:",
        after: `Each line must print a version. If \`jq --version\` prints \`command not found\`, install jq with Homebrew, or take jq's own build for your Mac's processor. ${macUname}`,
        choose: "Choose how to install jq",
        variants: jqMacWays,
        then: jqBuildNote,
      },
      stopMacos,
      {
        title: "Start the node once from the committed records",
        before: `From a terminal, even for a node the launchd agent runs, because an agent cannot run the \`$(...)\` part, ${otherFlags}`,
        code: `geth --classic --bootnodes ${recordsList()}`,
        after: recordsNote,
      },
      {
        title: darkCheckTitle,
        before: "In another terminal:",
        code: `geth attach --exec 'net.peerCount' ${IPC_MACOS}`,
        after: "For Mordor, use `~/Library/Ethereum/mordor`; if you pass `--datadir`, use yours.",
        choose: RUNS,
        variants: [
          {
            label: IN_TERMINAL,
            before: "Once the peer count is above zero, the node can run on in its terminal.",
          },
          { label: LAUNCHD, before: handBackService("agent"), code: agentStart },
        ],
      },
    ],
  },
  {
    id: "windows",
    label: "Windows",
    steps: [
      {
        title: "Read the committed records",
        code: `# In PowerShell, in the folder that holds the node's geth.exe
$nodes = (Invoke-WebRequest "${LISTS_REPO.classicNodes}" -UseBasicParsing).Content | ConvertFrom-Json
$records = ($nodes.PSObject.Properties.Value | Sort-Object score, lastResponse -Descending | Select-Object -First 20).record -join ","
$records.StartsWith("enr:")`,
        after:
          "The node can keep running for this step. The last line must print `True`. If it prints `False` or an error, the records were not read: do not start the node with them.",
      },
      moveStep("windows", "Stop the node cleanly"),
      {
        title: "Start the node once from them",
        before: `In the PowerShell window where you read the records, which holds them as \`$records\`, ${otherFlags}`,
        code: ".\\geth.exe --classic --bootnodes $records",
        after: `${recordsNote} A node that starts from the Startup folder takes this start in the window, and goes back to the folder in the next step.`,
      },
      {
        title: darkCheckTitle,
        before: "In a second PowerShell window, in the same folder:",
        code: `.\\geth.exe attach --exec 'net.peerCount' ${IPC_WINDOWS}`,
        choose: RUNS,
        variants: [
          {
            label: IN_WINDOW,
            before: "Once the peer count is above zero, the node can run on in its window.",
          },
          {
            label: STARTUP,
            before:
              "Once the peer count is above zero, hand the node back to the Startup folder: press Ctrl+C once in its window, wait for `Blockchain stopped`, and start it from the command file, which starts it without the records:",
            code: startupStart,
          },
        ],
      },
    ],
  },
  {
    id: "containers",
    label: "Containers",
    steps: [
      darkInstall(
        "These run on the host, in a Linux or macOS shell: on Windows, in a WSL terminal, with Docker Desktop's [WSL integration](https://docs.docker.com/desktop/features/wsl/) turned on. The command reads the records with curl and picks them out with jq:",
        true,
      ),
      darkCheck,
      {
        title: "Stop the node cleanly",
        code: "docker stop -t 300 core-geth",
        after: `Use \`-t 300\`: a plain \`docker stop\` kills the node if it has not stopped within 10 seconds. These commands use a container named \`core-geth\`, so put your own name in its place: a node [${GUIDE_PAGES.install.title}](${GUIDE_PAGES.install.href}) started is \`core-geth-classic\`.`,
      },
      {
        title: "Start it once from the committed records, in a container of its own",
        before: `This runs the container's own image on its data, in the foreground, with the records as bootnodes. Add the container's other flags after \`--classic\`, leaving out any \`--bootnodes\`, and use its P2P port mappings. If the container keeps its data inside itself rather than in a host directory or a volume, \`--volumes-from\` cannot reach it: copy the data out first, as the Containers tab of [this guide's steps](${GUIDE_PAGES.discovery.href}#steps) shows, and put \`-v $HOME/core-geth-data:/root\` in place of \`--volumes-from core-geth\`.`,
        code: `docker run --rm -it --name core-geth-records --volumes-from core-geth \\
  -p 30303:30303 -p 30303:30303/udp \\
  "$(docker inspect core-geth --format '{{.Config.Image}}')" \\
  --classic --bootnodes ${recordsList("    ")}`,
        after: recordsNote,
      },
      {
        title: darkCheckTitle,
        before: "In another terminal, while it runs:",
        code: "docker exec core-geth-records geth attach --exec 'net.peerCount' /root/.ethereum/classic/geth.ipc",
        after: "For Mordor, use `.ethereum/mordor` in the path.",
        more: [
          {
            before:
              "Once this prints a number above zero, press Ctrl-C once in the terminal it runs in, wait for `Blockchain stopped`, and start the usual container again, which starts it without the records:",
            code: "docker start core-geth",
          },
        ],
      },
    ],
  },
];

// What `gh attestation verify` prints, in a terminal, less the policy it enforced, which a reader
// does not act on. The archives and the image files are built by different workflows, and the
// attestation names the one that ran.
const attestationOutput = (file: string, workflow: string) =>
  `# Loaded digest sha256:... for file://${file}
# Loaded 1 attestation from GitHub API
# ✓ Verification succeeded!
#
# - Attestation #1
#   - Build repo:..... ${REPO.slug}
#   - Build workflow:. .github/workflows/${workflow}@refs/tags/${releaseTag}`;

const installationVerify = {
  label: "Verify where the archive came from",
  href: `${DOCS.installation.href}#verify-where-the-archive-came-from`,
};

// One panel per platform, each checking the file its install tab or release list gives a
// reader, in the installation guide's commands. A build from source has no published file to
// check, so its panel checks the commit instead, with the command the documentation's FAQ gives.
// Expected output sits in comments where the platform's shell allows them, and in the note under
// the block on macOS and for containers, which readers often run from a Mac.
export const VERIFY_PANELS: readonly PlatformPanel[] = [
  {
    id: "linux",
    label: "Linux",
    steps: [
      linuxSudo,
      ...ghSteps("linux"),
      {
        title: "Check an archive",
        before: `In the folder you downloaded it to. ${linuxUname}`,
        choose: CPU,
        variants: LINUX_CPUS.map(({ label, token }) => ({
          label,
          code: `# 1. Check that the archive arrived intact
sha256sum -c core-geth-${token}-${releaseTag}.zip.sha256
# core-geth-${token}-${releaseTag}.zip: OK

# 2. Check where the archive came from
gh attestation verify core-geth-${token}-${releaseTag}.zip --repo ${REPO.slug}
${attestationOutput(`core-geth-${token}-${releaseTag}.zip`, "release-packages.yml")}`,
        })),
        then: `\`sha256sum -c\` must print \`OK\`. If it prints \`FAILED\`, delete the file and download it again rather than running it. ${attestationMust("release-packages.yml")}`,
      },
    ],
    guide: installationVerify,
  },
  {
    id: "macos",
    label: "macOS",
    steps: [
      ...ghSteps("macos"),
      {
        title: "Check an archive",
        before: `In the folder you downloaded it to. ${macUname}`,
        choose: CPU,
        variants: MAC_CPUS.map(({ label, token }) => ({
          label,
          code: `shasum -a 256 -c core-geth-${token}-${releaseTag}.zip.sha256
gh attestation verify core-geth-${token}-${releaseTag}.zip --repo ${REPO.slug}`,
        })),
        then: `\`shasum -a 256 -c\` must print \`OK\`. If it prints \`FAILED\`, delete the file and download it again rather than running it. ${attestationMust("release-packages.yml")}`,
      },
    ],
    guide: installationVerify,
  },
  {
    id: "windows",
    label: "Windows",
    steps: [
      ...ghSteps("windows"),
      {
        title: "Check an archive",
        code: `# 1. Check that the archive arrived intact: compare these two lines, in PowerShell
(Get-FileHash "core-geth-win64-${releaseTag}.zip" -Algorithm SHA256).Hash
Get-Content "core-geth-win64-${releaseTag}.zip.sha256"

# 2. Check where the archive came from
gh attestation verify core-geth-win64-${releaseTag}.zip --repo ${REPO.slug}
${attestationOutput(`core-geth-win64-${releaseTag}.zip`, "release-packages.yml")}`,
        after: `${windowsCompare} If they differ, delete the file and download it again rather than running it. ${attestationMust("release-packages.yml")}`,
      },
    ],
    guide: installationVerify,
  },
  {
    id: "containers",
    label: "Containers",
    steps: [
      containerStep("load the image"),
      {
        title: "Check an image file",
        before:
          "Choose the host. A Mac checks the file with `shasum`, and Windows runs these lines in WSL, as the x86-64 Linux tab does:",
        choose: "Choose the host",
        variants: IMAGE_HOSTS.map(({ label, token, sum }) => ({
          label,
          code: `curl -LO ${assetBase}/core-geth-${token}-${releaseTag}.tar.gz
curl -LO ${assetBase}/core-geth-${token}-${releaseTag}.tar.gz.sha256
${sum} core-geth-${token}-${releaseTag}.tar.gz.sha256
gh attestation verify core-geth-${token}-${releaseTag}.tar.gz --repo ${REPO.slug}`,
        })),
        then: `The checksum line must print \`OK\`: if it prints \`FAILED\`, delete the file and download it again rather than loading it. ${attestationMust("docker-publish.yml", "load the file")}`,
      },
      {
        title: "Load the image",
        before: "Choose the processor you downloaded the file for:",
        choose: CPU,
        variants: IMAGE_CPUS.map(({ label, token }) => ({
          label,
          code: `docker load -i core-geth-${token}-${releaseTag}.tar.gz`,
        })),
        then: `The loaded image keeps its published name, with \`${releaseTag}\` as its tag and no \`latest\` tag. Use that name in place of \`latest\` in a \`docker run\` command, because a command that names \`latest\` makes Docker pull from the registry.`,
      },
    ],
    guide: {
      label: "Load the image from the release",
      href: `${DOCS.installation.href}#load-the-image-from-the-release`,
    },
  },
  {
    id: "source",
    label: "Source",
    // Its steps are the build-from-source tabs, VERIFY_SOURCE_PANELS, passed through the panel's slot.
    steps: [],
  },
];

// A build from source has no published file to check, so these tabs check the commit instead, with the
// command the documentation's FAQ gives. Go stamps the commit into the binary while `git` is installed.
const commitCheck = (code: string) => ({
  title: "Check the commit you built",
  code,
  after:
    "Run these in the clone: the first line is the commit you checked out and the second is the commit the binary was built from. Both lines must name the same commit.",
});

const verifyFaq = {
  label: "How do I verify a download?",
  href: `${DOCS_URL}about/faq/#how-do-i-verify-a-download`,
};

export const VERIFY_SOURCE_PANELS: readonly PlatformPanel[] = [
  {
    id: "linux",
    label: "Linux",
    heading: "Check a build from source on Linux",
    steps: [
      commitCheck(`git rev-parse HEAD
go version -m ./build/bin/geth | grep vcs.revision`),
    ],
    guide: verifyFaq,
  },
  {
    id: "macos",
    label: "macOS",
    heading: "Check a build from source on macOS",
    steps: [
      commitCheck(`git rev-parse HEAD
go version -m ./build/bin/geth | grep vcs.revision`),
    ],
    guide: verifyFaq,
  },
  {
    id: "windows",
    label: "Windows",
    heading: "Check a build from source on Windows",
    steps: [
      commitCheck(`git rev-parse HEAD
go version -m .\\build\\bin\\geth.exe | Select-String vcs.revision`),
    ],
    guide: verifyFaq,
  },
];

// The notes the install and move tabs carry above their steps, wherever the tabs are shown.
export const linuxArchiveNote = `The x86-64 and Arm64 archives need glibc 2.17 or newer, which is RHEL 7, CentOS 7 and anything more recent; the 32-bit Arm archives need glibc 2.28 or newer. The [release report](${DOCS.releaseReport.href}#archives) lists every archive and its platform.`;

export const sourceIntro =
  "Each tab starts from a machine with none of the build tools: it installs them, checks each one's version, and builds the `main` branch.";

export const moveSourceIntro =
  "Each tab starts from a machine with none of the build tools: it installs them, builds the `main` branch, and moves the node on that platform.";
