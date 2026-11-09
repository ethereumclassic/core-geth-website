/**
 * Every install, move and verify step on /downloads/, and in the guides that walk through the same
 * steps: each command is written here once. The panels read the latest release, its files and the
 * Go release `main` pins at build time, so a page that renders them needs no reads of its own.
 */
import type { PlatformPanel } from "@/components/PlatformTabs.astro";
import { getDiscovery, type NetworkDiscovery } from "@/data/discovery";
import { getDownloads } from "@/data/release-assets";
import { getRepository } from "@/data/repository";
import { getGoToolchain, type GoFile } from "@/data/toolchain";
import {
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
  "`gh --version` must print 2.49.0 or later, the release that added `gh attestation`. `gh auth status` must say you are logged in to github.com. If it does not, run `gh auth login`.";

const ghNeed = "Checking where a file came from needs the GitHub CLI, signed in to GitHub.";

// Each verify tab installs or updates the GitHub CLI the way its platform does, then checks it.
const ghSteps = (platform: "linux" | "macos" | "windows") => {
  const check = {
    title: "Check the GitHub CLI",
    code: ghTools,
    after: `${ghCheck} The checksum line in the next step does not need the GitHub CLI.`,
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
  return [
    {
      ...check,
      before:
        platform === "linux"
          ? `${ghNeed} Debian's and Ubuntu's own \`gh\` packages are older than 2.49.0, so install or update GitHub's own package, as [Installing gh on Linux](https://github.com/cli/cli/blob/trunk/docs/install_linux.md) shows for each distribution. Then confirm the release and the sign-in:`
          : `${ghNeed} Install or update it with Homebrew, \`brew install gh\`, or with the macOS installer from [GitHub's releases](https://github.com/cli/cli/releases/latest). Then confirm the release and the sign-in:`,
    },
  ];
};

const containerTools = `docker version --format '{{.Server.Version}}'
${ghTools}`;

const containerStep = (uses: string, kept = "") => ({
  title: "Check Docker and the GitHub CLI",
  before: `These steps need Docker to ${uses}, and the GitHub CLI to check where the image came from:`,
  code: containerTools,
  after: `${kept}The first line must print the Docker engine's version. An error in its place means Docker is not installed or not running: [Get Docker](https://docs.docker.com/get-started/get-docker/) says how to install it. ${ghCheck} Install or update the GitHub CLI from [cli.github.com](https://cli.github.com/). On Debian and Ubuntu, take GitHub's own package: theirs are older than 2.49.0.`,
});

// The Linux archive steps download with `curl` and unpack with `unzip`, which a minimal server install can
// lack. Each line ends at the distribution's current release: `apt-get install` also upgrades, DNF5's
// `install` leaves an installed package as it is, so Fedora's line upgrades as well, and Arch takes the full
// `-Syu` it requires.
const linuxFetchTools = (lead = "") => ({
  title: "Install curl and unzip",
  before: `${lead}On Debian or Ubuntu:`,
  code: "sudo apt-get update && sudo apt-get install -y curl unzip",
  after:
    "On Fedora or RHEL, run `sudo dnf install -y --refresh curl unzip && sudo dnf upgrade -y curl unzip` instead, and on Arch, `sudo pacman -Syu --needed curl unzip`. Each line also updates curl and unzip if they are already installed.",
});

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
const linuxTools = (lead = "") => ({
  title: "Install Git, a C compiler and make",
  before: `${lead}On Debian or Ubuntu:`,
  code: "sudo apt-get update && sudo apt-get install -y build-essential git curl",
  after:
    "On Fedora or RHEL, run `sudo dnf install -y --refresh gcc make git && sudo dnf upgrade -y gcc make git` instead, and on Arch, `sudo pacman -Syu --needed base-devel git`, which brings the rest of the system current with them, as Arch requires. Each line also updates a tool that is already installed. `build-essential` and `base-devel` carry the C compiler and `make`, and the next step downloads with `curl`.",
});

const linuxGo = {
  title: `Install Go ${GO_RELEASE}`,
  before: `${goArchive}:`,
  code: `curl -LO https://go.dev/dl/${goFile("linuxAmd64").filename}
echo "${goFile("linuxAmd64").sha256}  ${goFile("linuxAmd64").filename}" | sha256sum -c &&
  sudo rm -rf /usr/local/go &&
  sudo tar -C /usr/local -xzf ${goFile("linuxAmd64").filename} &&
  sudo ln -sf /usr/local/go/bin/go /usr/local/bin/go &&
  hash -r &&
  go version`,
  after: `\`sha256sum -c\` must print \`OK\`: if it prints \`FAILED\`, delete the file and download it again rather than installing it. The block replaces any Go in \`/usr/local/go\`, and \`go version\` must then print \`${go.version}\`. On a 64-bit Arm machine, where \`uname -m\` prints \`aarch64\`, put \`${goFile("linuxArm64").filename}\` in place of the file name and \`${goFile("linuxArm64").sha256}\` in place of the SHA-256. On 32-bit Arm, use \`${goFile("linuxArmv6l").filename}\` and \`${goFile("linuxArmv6l").sha256}\`.`,
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

const macosGo = (file: "darwinArm64" | "darwinAmd64") => ({
  title:
    file === "darwinArm64"
      ? `On an Apple Silicon Mac, install Go ${GO_RELEASE}`
      : `On an Intel Mac, install Go ${GO_RELEASE}`,
  before:
    file === "darwinArm64"
      ? `${goArchive}. \`uname -m\` prints \`arm64\` on Apple Silicon and \`x86_64\` on Intel:`
      : "The same release, built for Intel:",
  code: `curl -LO https://go.dev/dl/${goFile(file).filename}
echo "${goFile(file).sha256}  ${goFile(file).filename}" | shasum -a 256 -c &&
  sudo rm -rf /usr/local/go &&
  sudo tar -C /usr/local -xzf ${goFile(file).filename} &&
  sudo mkdir -p /usr/local/bin &&
  sudo ln -sf /usr/local/go/bin/go /usr/local/bin/go &&
  hash -r &&
  go version`,
  after: `\`shasum -a 256 -c\` must print \`OK\`: if it prints \`FAILED\`, delete the file and download it again rather than installing it. The block replaces any Go in \`/usr/local/go\`, and \`go version\` must then print \`${go.version}\`.`,
});

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

// Starting a node is the last step of every install tab, a download or a build from source, in a block of its
// own that a failed check or install above it cannot reach.
const startUnix = {
  title: "Start a node on Ethereum Classic",
  code: "geth --classic",
  after: "For the Mordor test network, run `geth --mordor` instead.",
};

const startWindows = {
  title: "Start a node on Ethereum Classic",
  code: `cd C:\\core-geth
.\\geth.exe --classic`,
  after: "For the Mordor test network, run `.\\geth.exe --mordor` instead.",
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

// The build-from-source tabs under Install: one per platform, each from nothing installed to a running node.
export const SOURCE_PANELS: readonly PlatformPanel[] = [
  {
    id: "linux",
    label: "Linux",
    heading: "Build from source on Linux",
    steps: [
      linuxTools(),
      linuxGo,
      linuxCheck,
      {
        title: "Build the main branch",
        code: buildMain,
        after: `${mainBranch} An existing \`core-geth\` folder stops this block at the clone rather than building an old copy: to build \`main\` again, run \`git pull\` in that folder and build there, or remove the folder first.`,
      },
      installBuild(),
      startUnix,
    ],
    guide: { label: "Build from source", href: DOCS.buildFromSource.href },
  },
  {
    id: "macos",
    label: "macOS",
    heading: "Build from source on macOS",
    steps: [
      macosTools(),
      macosGo("darwinArm64"),
      macosGo("darwinAmd64"),
      macosCheck,
      {
        title: "Build the main branch",
        code: buildMain,
        after: `${mainBranch} An existing \`core-geth\` folder stops this block at the clone rather than building an old copy: to build \`main\` again, run \`git pull\` in that folder and build there, or remove the folder first.`,
      },
      installBuild(true),
      startUnix,
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
      {
        title: "Build the main branch",
        code: windowsBuild,
        after: `${mainBranch} Run these in PowerShell, one line at a time. If \`git clone\` reports that \`core-geth\` already exists, run \`git pull\` in that folder before the build line.`,
      },
      installBuildWindows,
      startWindows,
    ],
    guide: { label: "Build from source", href: DOCS.buildFromSource.href },
  },
];

// One panel per platform the project publishes for, plus source. Every command is the one
// its linked guide gives, with that guide's version comment dropped, because this page
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
      linuxFetchTools(),
      {
        title: "Download the release, check it and install it",
        code: `curl -LO ${assetBase}/core-geth-linux-${releaseTag}.zip
curl -LO ${assetBase}/core-geth-linux-${releaseTag}.zip.sha256
sha256sum -c core-geth-linux-${releaseTag}.zip.sha256 &&
  unzip -o core-geth-linux-${releaseTag}.zip &&
  sudo install -m 0755 geth /usr/local/bin/geth &&
  geth version`,
        after:
          "`sha256sum -c` must print `OK`: if it prints `FAILED`, delete the file and download it again rather than running it. On an Arm machine, put the name for your processor where the file name says `linux`: `arm64` if `uname -m` prints `aarch64` or `arm64`, `arm7` for `armv7l`, `arm6` for `armv6l`, and `arm5` for `armv5tel`.",
      },
      startUnix,
    ],
    guide: { label: "Linux users guide", href: `${DOCS_URL}getting-started/run/linux/` },
  },
  {
    id: "macos",
    label: "macOS",
    steps: [
      {
        title: "Download the release, check it and install it",
        code: `curl -LO ${assetBase}/core-geth-osx-arm64-${releaseTag}.zip
curl -LO ${assetBase}/core-geth-osx-arm64-${releaseTag}.zip.sha256
shasum -a 256 -c core-geth-osx-arm64-${releaseTag}.zip.sha256 &&
  unzip -o core-geth-osx-arm64-${releaseTag}.zip &&
  sudo mkdir -p /usr/local/bin &&
  sudo install -m 0755 geth /usr/local/bin/geth &&
  geth version`,
        after: `\`shasum -a 256 -c\` must print \`OK\`: if it prints \`FAILED\`, delete the file and download it again rather than running it. On an Intel Mac, put \`osx\` where the file names say \`osx-arm64\`. A browser download carries the quarantine attribute, which macOS blocks: \`xattr -d com.apple.quarantine geth\` clears it.`,
      },
      startUnix,
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
          "The first line confirms that the image runs. The volume is mounted at `/root`, so the chain survives the container being replaced. For Mordor, run the same command with `core-geth-mordor` as the container and volume name and `--mordor` as the flag.",
      },
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
  "These commands install over `/usr/local/bin/geth`. If your unit or start command runs a `geth` at another path, use that path wherever they say `/usr/local/bin/geth`.";

// The first line names a release on every tab but Source, which builds `main`, so that tab checks the
// running node against what its own build printed.
const confirmNote = (version = `The first line must name a \`${RECOMMENDED_LINE}\` release.`) =>
  `If an attach line cannot connect, wait a minute and run it again. ${version} The enode ID must differ from the one you recorded. If it is the same, the node is still on the old key: stop it and redo the rename step. The peer count climbs within minutes. If it is still zero after five minutes, see [Why does the node have no peers?](${DOCS_URL}operate/troubleshooting/#why-does-the-node-have-no-peers), and if the lists and bootnodes have gone dark, [start it once from the node records](${DARK_LISTS}) committed in \`${LISTS_REPO.slug}\`. The block number starts near the one you recorded, or lower after an unclean stop, and climbs to the network's head: compare it with a block explorer or another node you run. If it stops climbing short of the head, investigate rather than resync.`;

// Peers a node lists by ID, in the file it reads at the start or on the console while it runs. The new
// ID exists only after the first start on the new key, so one step edits this node's own list while it
// is down, and another, after the start, gives the new ID to the nodes that list this one. Measured
// across a rotation, from `v1.12.17` up: a two-line file changes nothing but the list, and a console
// change lasts until that node restarts.
const staticPeersStep = (extra = "") => ({
  title: "If this node lists static peers, update the list",
  before:
    "They are under `[Node.P2P]` in the file you pass with `--config`. Edit it while the node is down:",
  code: `[Node.P2P]
StaticNodes = ["enode://<node ID>@<IP>:30303"]`,
  after: `A peer that has already moved has a new ID, so use that. Separate entries with commas. \`TrustedNodes\` takes the same entries. With no file yet, save these two lines and add \`--config\` and the file's path to the start command. The client ignores \`static-nodes.json\`, so move its entries here.${extra}`,
});

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
// caught up and holds peers (maintainer, 2026-11-04). The install steps at the top of this page suit it,
// because it has no old key, and it gets a machine of its own, because those steps install over the
// `geth` on `PATH` and start on the default data directory. It peers and syncs, but no RPC clients or
// miners point at it, as the census lede on `/security/` says, because the migration guide asks for one
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
// found. The rollback commands are each platform's migration guide's. A second rename on the same day
// meets the first one's target: GNU `mv -n` refuses it with `not replacing`, and the note names the fix.
const rollbackTitle = "If you need to roll back";
const removeOldTitle = `Once the node is stable, delete the ${EXPOSED_LINE} binary`;

const rollbackAfter = (date: string) =>
  `Roll back only for as long as it takes to find what went wrong: every \`${EXPOSED_LINE}\` release carries the flaws the audits found. Keep the new key: rolling back does not make the old key safe, and a release before \`${EXPOSED_LINE}.21\` leaks bits of the key it runs with, so rolling back to one exposes the new key too. Once the cause is fixed, move again with these steps, renaming the key again. A second rename on the same day finds its target name taken, so add \`-2\` after \`${date}\` in it. If the node has to stay back longer, [${GUIDE_PAGES.discovery.title}](${GUIDE_PAGES.discovery.href}) keeps it finding peers.`;

const rollbackUnix = {
  title: rollbackTitle,
  before: `The data directory works with both lines, so rolling back swaps the binary. Stop the node, and take any \`--mess\` flag out of its start command, because a \`${EXPOSED_LINE}\` binary refuses it. Under systemd, run \`sudo systemctl daemon-reload\`. Then put the old binary back, and start the node again:`,
  code: `sudo mv /usr/local/bin/geth-${EXPOSED_LINE} /usr/local/bin/geth`,
  after: rollbackAfter("$(date +%F)"),
};

const rollbackWindows = {
  title: rollbackTitle,
  before: `The data directory works with both lines, so rolling back swaps the binary. Stop the node, and take any \`--mess\` flag out of its start command, because a \`${EXPOSED_LINE}\` binary refuses it. Then, in PowerShell, in the folder that holds the node's \`geth.exe\`, put the old binary back, and start the node again:`,
  code: `Remove-Item .\\geth.exe
Rename-Item .\\geth-${EXPOSED_LINE}.exe geth.exe`,
  after: rollbackAfter("$(Get-Date -Format yyyy-MM-dd)"),
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

// Moving a node off the exposed line. Another page links this section rather than carrying a
// block of its own, because only this page's script gives a code block its copy button.
//
// One panel per platform, in the migration guide's order, except that the download comes first, so
// the node keeps running until the new release is in hand and checked. The blocks are separate on
// purpose: a pasted block carries on past a failed line, so the rename that rotates the key stands
// alone and the start has a block of its own, which a failed rename cannot reach. `&&` holds the
// install lines together for the same reason, and because a `sudo` line can swallow the lines still
// waiting in a paste. No block carries a comment, except in PowerShell, because stock zsh, the macOS
// default, treats `#` in a paste as a command or an argument.
//
// Every command is the one that platform's migration guide gives, apart from what keeps a paste safe
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
      linuxFetchTools("The node can keep running for this step. "),
      {
        title: "Download the release and check it",
        code: `curl -LO ${assetBase}/core-geth-linux-${releaseTag}.zip
curl -LO ${assetBase}/core-geth-linux-${releaseTag}.zip.sha256
sha256sum -c core-geth-linux-${releaseTag}.zip.sha256`,
        after: `The node can keep running for this step. \`sha256sum -c\` must print \`OK\`: if it prints \`FAILED\`, delete the file and download it again rather than running it. ${verifyPointer} On an Arm machine, put the name for your processor where the file name says \`linux\`, here and in "Install the release": \`arm64\` if \`uname -m\` prints \`aarch64\` or \`arm64\`, \`arm7\` for \`armv7l\`, \`arm6\` for \`armv6l\`, and \`arm5\` for \`armv5tel\`.`,
      },
      {
        title: "Record the node's block number and ID",
        code: `geth attach --exec 'eth.blockNumber' ~/.ethereum/classic/geth.ipc
geth attach --exec 'admin.nodeInfo.enode' ~/.ethereum/classic/geth.ipc`,
        after: `${keepId} These commands use the default data directory. For Mordor, use \`~/.ethereum/mordor\`; if you pass \`--datadir\`, use yours. On the unit in the [Linux run guide](${DOCS_URL}getting-started/run/linux/), the \`geth\` user owns \`/var/lib/core-geth\`, so attach as \`sudo -u geth -H geth --classic attach --exec 'admin.nodeInfo.enode' /var/lib/core-geth/geth.ipc\` instead, here and in every later attach line.`,
      },
      {
        title: "Stop the node cleanly",
        after: `Press Ctrl-C once in the node's terminal and wait, or stop the systemd unit you wrote, for example \`sudo systemctl stop core-geth\`. ${cleanStop} Under systemd, \`journalctl -u core-geth\` shows that log.`,
      },
      {
        title: "Install the release",
        code: `unzip -o core-geth-linux-${releaseTag}.zip &&
  { test -e /usr/local/bin/geth-${EXPOSED_LINE} || sudo mv /usr/local/bin/geth /usr/local/bin/geth-${EXPOSED_LINE}; } &&
  sudo install -m 0755 geth /usr/local/bin/geth &&
  geth version`,
        after: `Go on only if \`geth version\` reports a \`${RECOMMENDED_LINE}\` release. ${keepBinary} ${binaryPath}`,
      },
      {
        title: "Rename the old P2P node key",
        code: "mv -n ~/.ethereum/classic/geth/nodekey ~/.ethereum/classic/geth/nodekey.old-rotated-$(date +%F)",
        after: `${rotationRequired} On the unit in the Linux run guide, run \`sudo -u geth mv -n /var/lib/core-geth/geth/nodekey /var/lib/core-geth/geth/nodekey.old-rotated-$(date +%F)\` instead.`,
      },
      staticPeersStep(),
      checkFlags,
      {
        title: "Start the node",
        code: "sudo systemctl daemon-reload && sudo systemctl start core-geth",
        after:
          "`core-geth` stands for the systemd unit you wrote, and the reload picks up any flag you changed in that unit. From a terminal, run `geth --classic` instead, with the flags you just checked, `--mess` or `--mess=false` among them, and any other flag you start the node with, then run the next steps in a second terminal.",
      },
      {
        title: "Confirm the move",
        code: `geth attach --exec 'admin.nodeInfo.name' ~/.ethereum/classic/geth.ipc
geth attach --exec 'admin.nodeInfo.enode' ~/.ethereum/classic/geth.ipc
geth attach --exec 'net.peerCount' ~/.ethereum/classic/geth.ipc
geth attach --exec 'eth.blockNumber' ~/.ethereum/classic/geth.ipc`,
        after: confirmNote(),
      },
      otherNodesStep("geth attach", "~/.ethereum/classic/geth.ipc"),
      rollbackUnix,
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
        code: `curl -LO ${assetBase}/core-geth-osx-arm64-${releaseTag}.zip
curl -LO ${assetBase}/core-geth-osx-arm64-${releaseTag}.zip.sha256
shasum -a 256 -c core-geth-osx-arm64-${releaseTag}.zip.sha256`,
        after: `The node can keep running for this step. \`shasum -a 256 -c\` must print \`OK\`: if it prints \`FAILED\`, delete the file and download it again rather than running it. ${verifyPointer} On an Intel Mac, put \`osx\` where the file name says \`osx-arm64\`, here and in "Install the release".`,
      },
      {
        title: "Record the node's block number and ID",
        code: `geth attach --exec 'eth.blockNumber' ~/Library/Ethereum/classic/geth.ipc
geth attach --exec 'admin.nodeInfo.enode' ~/Library/Ethereum/classic/geth.ipc`,
        after: `${keepId} These commands use the default data directory. For Mordor, use \`~/Library/Ethereum/mordor\`; if you pass \`--datadir\`, use yours.`,
      },
      {
        title: "Stop the node cleanly",
        after: `Press Ctrl-C once in the node's terminal and wait, or unload the launchd job. [Stop it cleanly](${DOCS_URL}getting-started/run/macos/#7-stop-it-cleanly) has the command for the run guide's agent. ${cleanStop}`,
      },
      {
        title: "Install the release",
        code: `unzip -o core-geth-osx-arm64-${releaseTag}.zip &&
  { test -e /usr/local/bin/geth-${EXPOSED_LINE} || sudo mv /usr/local/bin/geth /usr/local/bin/geth-${EXPOSED_LINE}; } &&
  sudo install -m 0755 geth /usr/local/bin/geth &&
  geth version`,
        after: `Go on only if \`geth version\` reports a \`${RECOMMENDED_LINE}\` release. ${keepBinary} ${binaryPath}`,
      },
      {
        title: "Rename the old P2P node key",
        code: "mv -n ~/Library/Ethereum/classic/geth/nodekey ~/Library/Ethereum/classic/geth/nodekey.old-rotated-$(date +%F)",
        after: rotationRequired,
      },
      staticPeersStep(),
      checkFlags,
      {
        title: "Start the node",
        before: `In a terminal. ${startFlags} If the node runs under the run guide's launchd agent, start the agent instead, as [Keep it running](${DOCS_URL}getting-started/run/macos/#6-keep-it-running-a-launchd-agent) shows:`,
        code: "geth --classic",
        after:
          "The node runs in this terminal until you stop it, so run the next steps in a second terminal. For Mordor, use `--mordor` in place of `--classic`.",
      },
      {
        title: "Confirm the move",
        code: `geth attach --exec 'admin.nodeInfo.name' ~/Library/Ethereum/classic/geth.ipc
geth attach --exec 'admin.nodeInfo.enode' ~/Library/Ethereum/classic/geth.ipc
geth attach --exec 'net.peerCount' ~/Library/Ethereum/classic/geth.ipc
geth attach --exec 'eth.blockNumber' ~/Library/Ethereum/classic/geth.ipc`,
        after: confirmNote(),
      },
      otherNodesStep("geth attach", "~/Library/Ethereum/classic/geth.ipc"),
      rollbackUnix,
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
        code: `.\\geth.exe attach --exec 'eth.blockNumber' \\\\.\\pipe\\geth.ipc
.\\geth.exe attach --exec 'admin.nodeInfo.enode' \\\\.\\pipe\\geth.ipc`,
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
      staticPeersStep(
        " Save the file as UTF-8 with no byte order mark, after this edit and any other. A byte order mark, or UTF-16, stops the start with `invalid TOML syntax`.",
      ),
      checkFlags,
      {
        title: "Start the node",
        before: `In PowerShell, in the folder that holds the node's \`geth.exe\`. ${startFlags} If the node starts from the Startup folder, as the run guide's [Keep it running](${DOCS_URL}getting-started/run/windows/#6-keep-it-running-start-it-when-you-sign-in) sets up, run that command file instead:`,
        code: ".\\geth.exe --classic",
        after:
          "The node runs in this window until you stop it, so run the next steps in a second PowerShell window, in the same folder. For Mordor, use `--mordor` in place of `--classic`.",
      },
      {
        title: "Confirm the move",
        code: `.\\geth.exe attach --exec 'admin.nodeInfo.name' \\\\.\\pipe\\geth.ipc
.\\geth.exe attach --exec 'admin.nodeInfo.enode' \\\\.\\pipe\\geth.ipc
.\\geth.exe attach --exec 'net.peerCount' \\\\.\\pipe\\geth.ipc
.\\geth.exe attach --exec 'eth.blockNumber' \\\\.\\pipe\\geth.ipc`,
        after: confirmNote(),
      },
      otherNodesStep(".\\geth.exe attach", "\\\\.\\pipe\\geth.ipc"),
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
        title: "Record the node's block number, ID and restart policy",
        code: `docker exec core-geth geth attach --exec 'eth.blockNumber' /root/.ethereum/classic/geth.ipc
docker exec core-geth geth attach --exec 'admin.nodeInfo.enode' /root/.ethereum/classic/geth.ipc
docker inspect core-geth --format '{{.HostConfig.RestartPolicy.Name}}'`,
        after: `${keepId} The last line prints the container's restart policy, which the rollback puts back. These commands use a container named \`core-geth\` with its data at \`/root\`, so put your own name in its place. For Mordor, use \`.ethereum/mordor\` in the paths.`,
      },
      // A container started without `-v` keeps the chain in its own layer, because neither image
      // declares a volume, and `--volumes-from` does not reach it: the rename fails and the new
      // container starts empty. So the data's place is checked while the node runs, and a container
      // that holds its own data takes the copy step in place of the rename.
      {
        title: "Check where the container keeps its data",
        code: "docker inspect core-geth --format '{{range .Mounts}}{{.Destination}} {{end}}'",
        after:
          "This prints `/root`, or `/root/.ethereum`, when the data is in a host directory or a named volume, which the steps below carry to the new container. If it prints neither, the data is inside the container itself: after the stop, take the copy step below in place of the rename, or the new container starts with no chain and resyncs.",
      },
      {
        title: "Stop the node cleanly",
        code: `docker stop -t 300 core-geth
docker logs --tail 50 core-geth 2>&1 | grep 'Blockchain stopped'`,
        after: `The second command prints \`Blockchain stopped\` after a clean stop. If it prints nothing, the node did not stop cleanly: it recovers at its next start, moving its head back and importing those blocks again ([After an unclean stop](${DOCS_URL}operate/maintenance/#after-an-unclean-stop)), so its block number can start lower than the one you recorded. Use \`-t 300\`: a plain \`docker stop\` kills the node if it has not stopped within 10 seconds.`,
      },
      {
        title: "Rename the old P2P node key",
        before: "If the check printed `/root` or `/root/.ethereum`:",
        code: `docker run --rm --volumes-from core-geth --entrypoint sh ghcr.io/${REPO.slug}:latest \\
  -c "mv -n /root/.ethereum/classic/geth/nodekey /root/.ethereum/classic/geth/nodekey.old-rotated-$(date +%F)"`,
        after: rotationRequired,
      },
      {
        title: "If the data is inside the container, copy it out and rename the key there",
        before:
          "If the check printed neither, run this in place of the rename above. It copies the data out of the stopped container and renames the key in the copy, which needs as much free space as the chain takes:",
        code: `mkdir -p $HOME/core-geth-data &&
  docker cp core-geth:/root/. $HOME/core-geth-data/ &&
  docker run --rm -v $HOME/core-geth-data:/root --entrypoint sh ghcr.io/${REPO.slug}:latest \\
    -c "mv -n /root/.ethereum/classic/geth/nodekey /root/.ethereum/classic/geth/nodekey.old-rotated-$(date +%F)"`,
        after: `${rotationRequired} The chain comes with the copy, so the node does not resync.`,
      },
      staticPeersStep(
        ' To give the new container the file, add `-v <path>/config.toml:/config.toml:ro` to the `docker run` under "Replace the container", and `--config /config.toml` after the image name.',
      ),
      checkFlags,
      {
        title: "Replace the container",
        before: `Before you run this block, put the old container's flags in its last line and its \`GETH_\` variables in as \`-e\` options: \`docker inspect core-geth-${EXPOSED_LINE} --format '{{json .Args}} {{json .Config.Env}}'\` prints both. Keep its two P2P port mappings. The RPC check applies to the published RPC port, which stays on \`127.0.0.1\` even if the old container published it everywhere; \`--http.addr 0.0.0.0\` inside the container reaches only that port. If the old container ran with \`--network host\`, run this one that way too, without the \`-p\` options and with \`--http.addr 127.0.0.1\`. If you copied the data out, put \`-v $HOME/core-geth-data:/root\` in place of \`--volumes-from core-geth-${EXPOSED_LINE}\`.`,
        code: `docker rename core-geth core-geth-${EXPOSED_LINE}
docker update --restart no core-geth-${EXPOSED_LINE}
docker run -d --name core-geth \\
  --restart unless-stopped --stop-timeout 300 \\
  --volumes-from core-geth-${EXPOSED_LINE} \\
  -p 30303:30303 -p 30303:30303/udp -p 127.0.0.1:8545:8545 \\
  ghcr.io/${REPO.slug}:latest \\
  --classic --http --http.addr 0.0.0.0 --http.port 8545`,
        after:
          "For Mordor, use `--mordor` in place of `--classic`. The old container stays, stopped, and is what you roll back to.",
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
        before: `If you copied the data out, do not run this block, because the old container's own copy of the data still holds the old key. Stop and remove the new container as its first two lines do, then run the image the old one used, \`docker inspect core-geth-${EXPOSED_LINE} --format '{{.Config.Image}}'\`, on the copy, with \`-v $HOME/core-geth-data:/root\`, the old container's ports and flags, and no \`--mess\`.`,
        code: `docker stop -t 300 core-geth &&
  docker rm core-geth &&
  docker rename core-geth-${EXPOSED_LINE} core-geth &&
  docker update --restart unless-stopped core-geth &&
  docker start core-geth`,
        after: `Put the restart policy you recorded in place of \`unless-stopped\`. ${rollbackAfter("$(date +%F)")}`,
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

// The build-from-source tabs under moving a node: each platform's tools and build, then that platform's
// move steps above, with the build installed in place of the release. Those steps are taken from the
// platform's own tab by title, so the two cannot drift apart, and a title that is not there fails the build.
const moveStep = (id: PlatformPanel["id"], title: string) => {
  const step = MOVE_PANELS.find((panel) => panel.id === id)?.steps.find((s) => s.title === title);
  if (!step) throw new Error(`no "${title}" step in this section's ${id} tab`);
  return step;
};

const nodeKeepsRunning = "The node can keep running while you install the tools and build. ";

const buildGoOn = `Go on only if the first line \`geth version\` prints names version ${LINE_VERSION} or later; a build of \`main\` ends it with \`-unstable\`, and two builds a day apart can be different code. Keep the \`Git Commit\` line: "Confirm the move" checks the running node against it.`;

const unixMoveBuild = {
  title: "Build the main branch",
  code: buildMain,
  after: `${buildGoOn} If a \`core-geth\` folder is already there, run \`git pull\` in it and build there, or remove it first. The Source tab under [Install](/downloads/#${INSTALL_ANCHOR}) says why these steps build \`main\`.`,
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

const confirmBuild = (id: "linux" | "macos" | "windows") => ({
  ...moveStep(id, "Confirm the move"),
  after: confirmNote(
    "The first line must name the version the build printed, followed by the first eight characters of its `Git Commit`.",
  ),
});

const staticPeersTitle = "If this node lists static peers, update the list";
const otherNodesTitle = "If other nodes list this node, give them the new ID";

export const MOVE_SOURCE_PANELS: readonly PlatformPanel[] = [
  {
    id: "linux",
    label: "Linux",
    heading: "Build from source and move the node on Linux",
    steps: [
      trialNode,
      linuxTools(nodeKeepsRunning),
      linuxGo,
      linuxCheck,
      unixMoveBuild,
      moveStep("linux", "Record the node's block number and ID"),
      moveStep("linux", "Stop the node cleanly"),
      unixInstallBuild,
      moveStep("linux", "Rename the old P2P node key"),
      moveStep("linux", staticPeersTitle),
      checkFlags,
      moveStep("linux", "Start the node"),
      confirmBuild("linux"),
      moveStep("linux", otherNodesTitle),
      moveStep("linux", rollbackTitle),
      moveStep("linux", removeOldTitle),
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
      macosGo("darwinArm64"),
      macosGo("darwinAmd64"),
      macosCheck,
      unixMoveBuild,
      moveStep("macos", "Record the node's block number and ID"),
      moveStep("macos", "Stop the node cleanly"),
      unixInstallBuild,
      moveStep("macos", "Rename the old P2P node key"),
      moveStep("macos", staticPeersTitle),
      checkFlags,
      moveStep("macos", "Start the node"),
      confirmBuild("macos"),
      moveStep("macos", otherNodesTitle),
      moveStep("macos", rollbackTitle),
      moveStep("macos", removeOldTitle),
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
        code: windowsBuild,
        after: `${buildGoOn} Run these one line at a time. If \`git clone\` reports that \`core-geth\` already exists, run \`git pull\` in that folder before the build line. The Source tab under [Install](/downloads/#${INSTALL_ANCHOR}) says why these steps build \`main\`.`,
      },
      {
        ...moveStep("windows", "Record the node's block number and ID"),
        before:
          "In PowerShell, in the folder that holds the node's `geth.exe`, such as `C:\\core-geth`:",
      },
      moveStep("windows", "Stop the node cleanly"),
      windowsInstallBuild,
      moveStep("windows", "Rename the old P2P node key"),
      moveStep("windows", staticPeersTitle),
      checkFlags,
      moveStep("windows", "Start the node"),
      confirmBuild("windows"),
      moveStep("windows", otherNodesTitle),
      moveStep("windows", rollbackTitle),
      moveStep("windows", removeOldTitle),
    ],
    guide: { label: "Windows users guide", href: `${DOCS_URL}tutorials/migration/windows/` },
  },
];

export const moveLede = `${MOVE_RECOMMENDATION} ${UPGRADE_COST} Follow the steps for your platform below rather than the install steps at the top of this page, which start a node before its P2P node key changes. These steps keep your old binary or container so you can roll back while you find what went wrong, rotate the key before the node starts again, and end by deleting the old binary once the node is stable. The rotation is required: one of the flaws in the \`${EXPOSED_LINE}\` line leaks bits of the P2P node key across repeated handshakes, and no fix can take back what already leaked.`;

export const moveNote = `The [migration guide](${DOCS.migration.href}) also says what else names this node.`;

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

/** The old container's replacement, from the same image, on the same data. */
const containerReplace = (
  network: Network,
) => `IMAGE=$(docker inspect core-geth --format '{{.Config.Image}}') &&
  docker rename core-geth core-geth-old &&
  docker update --restart no core-geth-old &&
  docker run -d --name core-geth \\
    --restart unless-stopped --stop-timeout 300 \\
    --volumes-from core-geth-old \\
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

const mordorStep = (title: string, code: string, after: string) => ({
  title,
  before: "Mordor, Ethereum Classic's test network, has lists and bootnodes of its own:",
  code,
  after: `The notes under "${after}" apply to this one too.`,
});

const confirmPeers = (attach: string, ipc: string, before: string, extra = "") => ({
  title: "Confirm the node holds peers",
  before,
  code: `${attach} --exec 'net.peerCount' ${ipc}
${attach} --exec 'eth.blockNumber' ${ipc}`,
  after: `If an attach line cannot connect, wait a minute and run it again. The peer count climbs within minutes. If it is still zero after five minutes, see [Why does the node have no peers?](${DOCS_URL}operate/troubleshooting/#why-does-the-node-have-no-peers), and if the lists and bootnodes have gone dark, [start it once from the node records](${DARK_LISTS}). The block number starts near the one you recorded, or lower after an unclean stop, and climbs to the network's head.${extra}`,
});

// Pointing a node that cannot move yet at the recommended line's lists and bootnodes, on each platform. A
// node built from source starts the same way as its platform's download, so there is no Source tab.
export const DISCOVERY_PANELS: readonly PlatformPanel[] = [
  {
    id: "linux",
    label: "Linux",
    steps: [
      {
        title: "Record the node's block number",
        code: "geth attach --exec 'eth.blockNumber' ~/.ethereum/classic/geth.ipc",
        after: recordNote(
          `The command uses the default data directory. For Mordor, use \`~/.ethereum/mordor\`; if you pass \`--datadir\`, use yours. On the unit in the [Linux run guide](${DOCS_URL}getting-started/run/linux/), the \`geth\` user owns \`/var/lib/core-geth\`, so attach as \`sudo -u geth -H geth --classic attach --exec 'eth.blockNumber' /var/lib/core-geth/geth.ipc\` instead, here and in every later attach line.`,
        ),
      },
      moveStep("linux", "Stop the node cleanly"),
      configFileStep(),
      {
        title: startTitle,
        before: `From a terminal, ${otherFlags}`,
        code: startLine("classic"),
        after: `Under systemd, put the two flags and their values on the unit's \`ExecStart\` line instead, then run \`sudo systemctl daemon-reload && sudo systemctl start core-geth\`, where \`core-geth\` stands for your unit. ${alreadyHas("the line")} ${listsInPlace}`,
      },
      mordorStep("On Mordor, start it with this line instead", startLine("mordor"), startTitle),
      confirmPeers("geth attach", "~/.ethereum/classic/geth.ipc", "In another terminal:"),
    ],
  },
  {
    id: "macos",
    label: "macOS",
    steps: [
      {
        title: "Record the node's block number",
        code: "geth attach --exec 'eth.blockNumber' ~/Library/Ethereum/classic/geth.ipc",
        after: recordNote(
          "The command uses the default data directory. For Mordor, use `~/Library/Ethereum/mordor`; if you pass `--datadir`, use yours.",
        ),
      },
      moveStep("macos", "Stop the node cleanly"),
      configFileStep(),
      {
        title: startTitle,
        before: `From a terminal, ${otherFlags}`,
        code: startLine("classic"),
        after: `If the node runs under the run guide's launchd agent, add the two flags and their values to the agent's \`ProgramArguments\` instead, each as a \`<string>\` of its own, and start the agent as [Keep it running](${DOCS_URL}getting-started/run/macos/#6-keep-it-running-a-launchd-agent) shows. ${alreadyHas("the line")} ${listsInPlace}`,
      },
      mordorStep("On Mordor, start it with this line instead", startLine("mordor"), startTitle),
      confirmPeers("geth attach", "~/Library/Ethereum/classic/geth.ipc", "In another terminal:"),
    ],
  },
  {
    id: "windows",
    label: "Windows",
    steps: [
      {
        title: "Record the node's block number",
        before: "In PowerShell, in the folder that holds the node's `geth.exe`:",
        code: ".\\geth.exe attach --exec 'eth.blockNumber' \\\\.\\pipe\\geth.ipc",
        after: recordNote(),
      },
      moveStep("windows", "Stop the node cleanly"),
      configFileStep(
        " Save the file as UTF-8 with no byte order mark. A byte order mark, or UTF-16, stops the start with `invalid TOML syntax`.",
      ),
      {
        title: startTitle,
        before: `In PowerShell, in the folder that holds the node's \`geth.exe\`, ${otherFlags}`,
        code: startLineWindows("classic"),
        after: `If the node starts from the Startup folder, as the run guide's [Keep it running](${DOCS_URL}getting-started/run/windows/#6-keep-it-running-start-it-when-you-sign-in) sets up, put the two flags and their values on the line in that command file instead, and run it. ${alreadyHas("the line")} ${listsInPlace}`,
      },
      mordorStep(
        "On Mordor, start it with this line instead",
        startLineWindows("mordor"),
        startTitle,
      ),
      confirmPeers(
        ".\\geth.exe attach",
        "\\\\.\\pipe\\geth.ipc",
        "In a second PowerShell window, in the same folder:",
      ),
    ],
  },
  {
    id: "containers",
    label: "Containers",
    steps: [
      {
        title: "Record the node's block number, image and restart policy",
        code: `docker exec core-geth geth attach --exec 'eth.blockNumber' /root/.ethereum/classic/geth.ipc
docker inspect core-geth --format '{{.Config.Image}}'
docker inspect core-geth --format '{{.HostConfig.RestartPolicy.Name}}'`,
        after: `Keep what these print: "Confirm the node holds peers" compares the block number, the new container runs the same \`${EXPOSED_LINE}\` image, and it takes the old container's restart policy. These commands use a container named \`core-geth\` with its data at \`/root\`, so put your own name in its place. For Mordor, use \`.ethereum/mordor\` in the path.`,
      },
      {
        ...moveStep("containers", "Check where the container keeps its data"),
        after:
          "This prints `/root`, or `/root/.ethereum`, when the data is in a host directory or a named volume, which the new container takes over. If it prints neither, the data is inside the container itself: after the stop, take the copy step below, or the new container starts with no chain and resyncs.",
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
        before: `A container cannot take a new flag, so this block replaces it with one from the same image, on the same data. Before you run it, put the old container's flags in its last lines, after \`--classic\`, and its \`GETH_\` variables in as \`-e\` options: \`docker inspect core-geth --format '{{json .Args}} {{json .Config.Env}}'\` prints both. Keep its port mappings, and put the restart policy you recorded in place of \`unless-stopped\`. If the old container ran with \`--network host\`, run this one that way too, without the \`-p\` options and with \`--http.addr 127.0.0.1\`. If you copied the data out, put \`-v $HOME/core-geth-data:/root\` in place of \`--volumes-from core-geth-old\`.`,
        code: containerReplace("classic"),
        after: `${alreadyHas("the old container's flags")} ${listsInPlace}`,
      },
      mordorStep("On Mordor, run this block instead", containerReplace("mordor"), replaceTitle),
      confirmPeers(
        "docker exec core-geth geth attach",
        "/root/.ethereum/classic/geth.ipc",
        "For Mordor, use `.ethereum/mordor` in the paths:",
        " The old container stays, stopped, as `core-geth-old`. Once the new one holds peers, remove it with `docker rm core-geth-old`, which leaves the volumes the new container uses.",
      ),
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

const darkTools = (install: string) => ({
  title: "Check that curl and jq are installed",
  code: `curl --version
jq --version`,
  after: `The node can keep running for this step. Each line must print a version. ${install}`,
});

const darkCheckTitle = "Check that it holds peers, then start it the usual way";

export const DARK_PANELS: readonly PlatformPanel[] = [
  {
    id: "linux",
    label: "Linux",
    steps: [
      darkTools(
        "If `jq --version` prints `command not found`, install jq with your package manager, such as `sudo apt-get install jq` on Debian and Ubuntu or `sudo dnf install jq` on Fedora.",
      ),
      {
        title: "Start the node once from the committed records",
        before: `Stop the node cleanly first: press Ctrl-C once in its terminal, or stop its systemd unit, and wait for \`Blockchain stopped\`. Then, from a terminal, ${otherFlags}`,
        code: `geth --classic --bootnodes ${recordsList()}`,
        after: `${recordsNote} Under systemd, a unit cannot run the \`$(...)\` part, so stop the unit and run this line from a terminal, with the unit's flags, as the user the unit runs as: for the unit in the [Linux run guide](${DOCS_URL}getting-started/run/linux/), begin it with \`sudo -u geth -H geth --classic --datadir /var/lib/core-geth\` in place of \`geth --classic\`.`,
      },
      {
        title: darkCheckTitle,
        before: "In another terminal:",
        code: "geth attach --exec 'net.peerCount' ~/.ethereum/classic/geth.ipc",
        after:
          "Once this prints a number above zero, the node can run on. To hand it back to its systemd unit, press Ctrl-C once in its terminal, wait for `Blockchain stopped`, and start the unit, which starts it without the records. For Mordor, use `~/.ethereum/mordor`; if you pass `--datadir`, use yours, such as `/var/lib/core-geth/geth.ipc` for the unit in the run guide.",
      },
    ],
  },
  {
    id: "macos",
    label: "macOS",
    steps: [
      darkTools(
        "If `jq --version` prints `command not found`, install it with Homebrew: `brew install jq`.",
      ),
      {
        title: "Start the node once from the committed records",
        before: `Stop the node cleanly first: press Ctrl-C once in its terminal, or unload its launchd job, and wait for \`Blockchain stopped\`. Then, from a terminal, ${otherFlags}`,
        code: `geth --classic --bootnodes ${recordsList()}`,
        after: `${recordsNote} A launchd agent cannot run the \`$(...)\` part, so run this line from a terminal for that start instead.`,
      },
      {
        title: darkCheckTitle,
        before: "In another terminal:",
        code: "geth attach --exec 'net.peerCount' ~/Library/Ethereum/classic/geth.ipc",
        after:
          "Once this prints a number above zero, the node can run on. To hand it back to its launchd agent, press Ctrl-C once in its terminal, wait for `Blockchain stopped`, and start the agent, which starts it without the records. For Mordor, use `~/Library/Ethereum/mordor`; if you pass `--datadir`, use yours.",
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
      {
        title: "Start the node once from them",
        before: `Stop the node cleanly first: press Ctrl+C once in its console window and wait for \`Blockchain stopped\`. Then, in the PowerShell window where you read the records, which holds them as \`$records\`, ${otherFlags}`,
        code: ".\\geth.exe --classic --bootnodes $records",
        after: `${recordsNote} If the node starts from the Startup folder, run this line for that start instead.`,
      },
      {
        title: darkCheckTitle,
        before: "In a second PowerShell window, in the same folder:",
        code: ".\\geth.exe attach --exec 'net.peerCount' \\\\.\\pipe\\geth.ipc",
        after:
          "Once this prints a number above zero, the node can run on. To hand it back to the Startup folder, press Ctrl+C once in its console window, wait for `Blockchain stopped`, and run the command file there, which starts it without the records.",
      },
    ],
  },
  {
    id: "containers",
    label: "Containers",
    steps: [
      darkTools(
        "These run on the host. If `jq --version` prints `command not found`, install jq with the host's package manager.",
      ),
      {
        title: "Stop the node cleanly",
        code: "docker stop -t 300 core-geth",
        after:
          "Use `-t 300`: a plain `docker stop` kills the node if it has not stopped within 10 seconds. These commands use a container named `core-geth`, so put your own name in its place.",
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
        after:
          "Once this prints a number above zero, press Ctrl-C once in the terminal it runs in, wait for `Blockchain stopped`, and start the usual container again, which starts it without the records: `docker start core-geth`. For Mordor, use `.ethereum/mordor` in the path.",
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
      ...ghSteps("linux"),
      {
        title: "Check an archive",
        code: `# 1. Check that the archive arrived intact
sha256sum -c core-geth-linux-${releaseTag}.zip.sha256
# core-geth-linux-${releaseTag}.zip: OK

# 2. Check where the archive came from
gh attestation verify core-geth-linux-${releaseTag}.zip --repo ${REPO.slug}
${attestationOutput(`core-geth-linux-${releaseTag}.zip`, "release-packages.yml")}`,
        after: `\`sha256sum -c\` must print \`OK\`. If it prints \`FAILED\`, delete the file and download it again rather than running it. ${attestationMust("release-packages.yml")} For another archive, put its name in place of \`core-geth-linux-${releaseTag}.zip\`, such as \`core-geth-arm64-${releaseTag}.zip\`.`,
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
        code: `shasum -a 256 -c core-geth-osx-arm64-${releaseTag}.zip.sha256
gh attestation verify core-geth-osx-arm64-${releaseTag}.zip --repo ${REPO.slug}`,
        after: `\`shasum -a 256 -c\` must print \`OK\`. If it prints \`FAILED\`, delete the file and download it again rather than running it. ${attestationMust("release-packages.yml")} On an Intel Mac, put \`osx\` where the file names say \`osx-arm64\`.`,
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
        code: `curl -LO ${assetBase}/core-geth-docker-amd64-${releaseTag}.tar.gz
curl -LO ${assetBase}/core-geth-docker-amd64-${releaseTag}.tar.gz.sha256
sha256sum -c core-geth-docker-amd64-${releaseTag}.tar.gz.sha256
gh attestation verify core-geth-docker-amd64-${releaseTag}.tar.gz --repo ${REPO.slug}`,
        after: `On an Arm64 host, put \`docker-arm64\` where the file name says \`docker-amd64\`. \`sha256sum -c\` must print \`OK\`: if it prints \`FAILED\`, delete the file and download it again rather than loading it. ${attestationMust("docker-publish.yml", "load the file")}`,
      },
      {
        title: "Load the image",
        code: `docker load -i core-geth-docker-amd64-${releaseTag}.tar.gz`,
        after: `The loaded image keeps its published name, with \`${releaseTag}\` as its tag and no \`latest\` tag. Use that name in place of \`latest\` in a \`docker run\` command, because a command that names \`latest\` makes Docker pull from the registry.`,
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
