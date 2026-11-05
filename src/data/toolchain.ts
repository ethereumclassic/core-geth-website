/**
 * The Go a build of `main` uses: the release `main` pins for its own release builds, read once per
 * build from `build/checksums.txt` on `main` in `ethereumclassic/core-geth`, never in a visitor's
 * browser (maintainer, 2026-11-05: "pinned to whatever version is on main"). The file's
 * `# version:golang` line names the release, and the file lists the SHA-256 of each Go archive, the
 * hashes `go run build/ci.go install -dlgo` checks. So a pull request that moves the pin moves the
 * steps at this site's next build, with no edit here.
 *
 * Go's Windows installer is not in that file, so its SHA-256 comes from go.dev's release feed, and only
 * when the feed's Windows archive for the same release has the pinned SHA-256: then both name one
 * release, and the installer is that release's.
 *
 * If either source cannot be read, or they disagree, the build logs a warning and uses
 * toolchain-snapshot.json, the last values read, all of them, so a page never mixes two releases.
 * Refresh it by hand when `main` moves its pin.
 */
import snapshot from "./toolchain-snapshot.json";
import { REPO } from "./site";

/** The files the steps download: the pinned archives, and the Windows installer. */
export const GO_FILES = {
  linuxAmd64: "linux-amd64.tar.gz",
  linuxArm64: "linux-arm64.tar.gz",
  linuxArmv6l: "linux-armv6l.tar.gz",
  darwinArm64: "darwin-arm64.tar.gz",
  darwinAmd64: "darwin-amd64.tar.gz",
  windowsAmd64: "windows-amd64.msi",
} as const;

export type GoFile = keyof typeof GO_FILES;

export interface GoToolchain {
  /** The pinned release as `go version` prints it, such as `go1.26.8`. */
  version: string;
  files: Record<GoFile, { filename: string; sha256: string }>;
  source: "live" | "snapshot";
}

const CHECKSUMS = `https://raw.githubusercontent.com/${REPO.slug}/main/build/checksums.txt`;
const FEED = "https://go.dev/dl/?mode=json&include=all";
const PIN = /^# version:golang (\d+\.\d+\.\d+)\s*$/m;

async function read(url: string): Promise<Response> {
  const response = await fetch(url, {
    headers: { "user-agent": "coregeth.com-build" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  return response;
}

interface FeedRelease {
  version?: unknown;
  files?: { filename?: unknown; sha256?: unknown }[];
}

async function live(): Promise<GoToolchain> {
  const pins = await (await read(CHECKSUMS)).text();
  const release = PIN.exec(pins)?.[1];
  if (!release) throw new Error("no # version:golang line in main's build/checksums.txt");
  const version = `go${release}`;
  const pinned = (suffix: string) => {
    const filename = `${version}.${suffix}`;
    const line = pins.split("\n").find((l) => l.trim().endsWith(`  ${filename}`));
    const sha256 = line?.trim().split(/\s+/)[0];
    if (!sha256 || !/^[0-9a-f]{64}$/.test(sha256)) {
      throw new Error(`main's build/checksums.txt pins no SHA-256 for ${filename}`);
    }
    return { filename, sha256 };
  };

  const files = {} as GoToolchain["files"];
  for (const key of Object.keys(GO_FILES) as GoFile[]) {
    if (key !== "windowsAmd64") files[key] = pinned(GO_FILES[key]);
  }

  // The installer's SHA-256, from the feed's entry for the pinned release, once that entry's Windows
  // archive is the pinned one.
  const feed = (await (await read(FEED)).json()) as unknown;
  if (!Array.isArray(feed)) throw new Error("go.dev's release feed returned an unexpected shape");
  const entry = (feed as FeedRelease[]).find((r) => r.version === version);
  const inFeed = (filename: string) => entry?.files?.find((f) => f.filename === filename)?.sha256;
  const archive = pinned("windows-amd64.zip");
  if (inFeed(archive.filename) !== archive.sha256) {
    throw new Error(`go.dev's feed and main's pin disagree on ${archive.filename}`);
  }
  const msi = `${version}.${GO_FILES.windowsAmd64}`;
  const sha256 = inFeed(msi);
  if (typeof sha256 !== "string" || !/^[0-9a-f]{64}$/.test(sha256)) {
    throw new Error(`go.dev's feed lists no SHA-256 for ${msi}`);
  }
  files.windowsAmd64 = { filename: msi, sha256 };
  return { version, files, source: "live" };
}

function fromSnapshot(reason: unknown): GoToolchain {
  const why = reason instanceof Error ? reason.message : String(reason);
  console.warn(
    `[coregeth.com] Go toolchain facts unavailable (${why}); the build uses src/data/toolchain-snapshot.json, as of ${snapshot.asOf}.`,
  );
  return { version: snapshot.version, files: snapshot.files, source: "snapshot" };
}

let toolchain: Promise<GoToolchain> | undefined;

/** One read of each source per build, shared by every page that names the toolchain. */
export function getGoToolchain(): Promise<GoToolchain> {
  toolchain ??= live().catch(fromSnapshot);
  return toolchain;
}
