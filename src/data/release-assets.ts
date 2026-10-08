/**
 * The published files of the latest release, read from the GitHub API once per build.
 *
 * Nothing here is written by hand: the download table is whatever the release actually
 * published, so a release cannot leave a stale list behind. When the API cannot be
 * reached the page says so and sends the reader to the releases page, rather than
 * showing a list that may be wrong.
 *
 * Asset names follow the release pipeline's own scheme, `core-geth-<platform>-<tag>.zip`
 * for the client and `core-geth-alltools-<platform>-<tag>.zip` for the client with the
 * tools, each beside a `.sha256`. Docker image tarballs use `.tar.gz`.
 */
import { REPO } from "./site";

export interface DownloadFile {
  /** The published file name, which is what the reader ends up with on disk. */
  name: string;
  /** What the archive holds: the client, or the client and the tools. */
  kind: "Core-Geth" | "Core-Geth and tools";
  /** The platform token from the file name, such as `linux` or `osx-arm64`. */
  platform: string;
  /** What that token means to a reader, such as "x86-64" or "Apple Silicon". */
  arch: string;
  /** The machine it is for, in the installation guide's words, so a reader can pick
      without knowing what an architecture token means. */
  machine: string;
  size: string;
  href: string;
  /** The `.sha256` published beside it, when the release carries one. */
  checksum?: string;
}

export interface DownloadGroup {
  /** Stable key the page's tabs select on, independent of the heading's wording. */
  id: GroupId;
  heading: string;
  note?: string;
  files: DownloadFile[];
}

export interface ReleaseDownloads {
  tag: string;
  published: string;
  notes: string;
  groups: DownloadGroup[];
}

type GroupId = "linux" | "macos" | "windows" | "containers";

/** The published platforms, in the order the page offers them. */
const GROUPS: Readonly<Record<GroupId, { heading: string; note: string }>> = {
  linux: {
    heading: "Linux",
    note: "`uname -m` decides which archive you need, whatever distribution you run: a 64-bit capable board can still be running a 32-bit system. The x86-64 and Arm64 archives need glibc 2.17 or newer, which is RHEL 7, CentOS 7 and anything more recent; the 32-bit Arm archives need 2.28.",
  },
  macos: {
    heading: "macOS",
    note: "Built for macOS 12 and newer. macOS blocks a downloaded binary until it is allowed.",
  },
  windows: {
    heading: "Windows",
    note: "Windows names the publisher as unknown on a first run.",
  },
  containers: {
    heading: "Container image",
    note: "A tarball to load into a local daemon. Pulling the published image is the usual route.",
  },
};

/**
 * Platform tokens, in the order a reader looks for them. `machine` is the installation
 * guide's own description of the machine each archive is for: `uname -m` decides it on
 * Linux, and a 64-bit capable board can still be running a 32-bit system.
 */
const PLATFORMS: readonly { token: string; group: GroupId; arch: string; machine: string }[] = [
  {
    token: "linux",
    group: "linux",
    arch: "x86-64",
    machine: "`x86_64`: most servers and desktops",
  },
  {
    token: "arm64",
    group: "linux",
    arch: "Arm64",
    machine: "`aarch64` or `arm64`: Raspberry Pi on a 64-bit OS, AWS Graviton, Ampere",
  },
  {
    token: "arm7",
    group: "linux",
    arch: "Arm v7",
    machine: "`armv7l`: Raspberry Pi on a 32-bit OS, and other 32-bit boards",
  },
  { token: "arm6", group: "linux", arch: "Arm v6", machine: "`armv6l`: older Raspberry Pi" },
  {
    token: "arm5",
    group: "linux",
    arch: "Arm v5",
    machine: "`armv5tel` and other `armv5`: embedded boards",
  },
  { token: "arm", group: "linux", arch: "Arm", machine: "Other 32-bit Arm boards" },
  {
    token: "osx-arm64",
    group: "macos",
    arch: "Apple Silicon",
    machine: "Apple Silicon, M1 and later",
  },
  { token: "osx", group: "macos", arch: "Intel", machine: "Intel Macs" },
  { token: "win64", group: "windows", arch: "x86-64", machine: "64-bit Windows" },
  {
    token: "docker-amd64",
    group: "containers",
    arch: "x86-64",
    machine: "`linux/amd64` hosts",
  },
  {
    token: "docker-arm64",
    group: "containers",
    arch: "Arm64",
    machine: "`linux/arm64` hosts",
  },
];

const MB = 1024 * 1024;
const megabytes = (bytes: number) => `${(bytes / MB).toFixed(bytes >= 10 * MB ? 0 : 1)} MB`;

/** Longest token first, so `osx-arm64` is not read as `osx` and `arm64` not as `arm`. */
const byLongestToken = [...PLATFORMS].sort((a, b) => b.token.length - a.token.length);

function parse(name: string, tag: string) {
  const tools = name.startsWith("core-geth-alltools-");
  const rest = name
    .replace("core-geth-alltools-", "")
    .replace("core-geth-", "")
    .replace(`-${tag}.tar.gz`, "")
    .replace(`-${tag}.zip`, "");
  const platform = byLongestToken.find((p) => p.token === rest);
  if (!platform) return undefined;
  return { tools, platform };
}

export async function getDownloads(): Promise<ReleaseDownloads | undefined> {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO.slug}/releases/latest`, {
      headers: {
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        "user-agent": "coregeth.com-build",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} from the releases API`);
    const release = (await response.json()) as {
      tag_name?: unknown;
      published_at?: unknown;
      html_url?: unknown;
      assets?: unknown;
    };
    const tag = release.tag_name;
    const published = release.published_at;
    const notes = release.html_url;
    if (typeof tag !== "string" || typeof published !== "string" || typeof notes !== "string") {
      throw new Error("the releases API returned an unexpected shape");
    }
    const assets = (Array.isArray(release.assets) ? release.assets : []) as {
      name?: unknown;
      size?: unknown;
      browser_download_url?: unknown;
    }[];

    const checksums = new Map<string, string>();
    for (const asset of assets) {
      if (typeof asset.name === "string" && asset.name.endsWith(".sha256")) {
        checksums.set(asset.name.replace(/\.sha256$/, ""), String(asset.browser_download_url));
      }
    }

    const grouped = new Map<GroupId, DownloadFile[]>();
    const unparsed: string[] = [];
    for (const asset of assets) {
      const { name, size, browser_download_url: href } = asset;
      if (typeof name !== "string" || typeof size !== "number" || typeof href !== "string")
        continue;
      if (name.endsWith(".sha256")) continue;
      const parsed = parse(name, tag);
      if (!parsed) {
        unparsed.push(name);
        continue;
      }
      const file: DownloadFile = {
        name,
        kind: parsed.tools ? "Core-Geth and tools" : "Core-Geth",
        platform: parsed.platform.token,
        arch: parsed.platform.arch,
        machine: parsed.platform.machine,
        size: megabytes(size),
        href,
        ...(checksums.has(name) ? { checksum: checksums.get(name) as string } : {}),
      };
      const list = grouped.get(parsed.platform.group) ?? [];
      list.push(file);
      grouped.set(parsed.platform.group, list);
    }

    // A platform token this table does not know would otherwise be dropped in silence,
    // so the release would publish a file the page never shows. Say so at build time.
    if (unparsed.length > 0) {
      console.warn(
        `[downloads] ${unparsed.length} published file(s) matched no known platform and are not listed: ${unparsed.join(", ")}. Add the token to PLATFORMS in src/data/release-assets.ts.`,
      );
    }

    const rank = (file: DownloadFile) =>
      byLongestToken.findIndex((p) => p.token === file.platform) +
      (file.kind === "Core-Geth" ? 0 : 100);

    return {
      tag,
      published: published.slice(0, 10),
      notes,
      groups: (Object.keys(GROUPS) as GroupId[])
        .filter((id) => grouped.has(id))
        .map((id) => ({
          id,
          heading: GROUPS[id].heading,
          note: GROUPS[id].note,
          files: (grouped.get(id) ?? []).sort((a, b) => rank(a) - rank(b)),
        })),
    };
  } catch (reason) {
    console.warn(
      `[downloads] listing the release's files failed, so the page links the releases page instead: ${String(reason)}`,
    );
    return undefined;
  }
}
