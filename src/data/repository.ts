/**
 * The repository's facts: the description the repository card prints, and the latest release's
 * tag, which the download commands fall back on when the release's file list cannot be read.
 *
 * Read from the GitHub API once per build, never in the visitor's browser, so a
 * page view makes no request to GitHub and no third party learns who is reading.
 *
 * If the API cannot be reached, is rate limited, or returns something unexpected,
 * the build falls back to repository-snapshot.json, the last known values. Refresh the
 * snapshot by hand when a release ships.
 */
import snapshot from "./repository-snapshot.json";
import { REPO } from "./site";

export interface RepositoryFacts {
  description: string;
  release: { tag: string };
  source: "github" | "snapshot";
}

const API = `https://api.github.com/repos/${REPO.slug}`;

// A release tag is named in the download commands, so only a plain version tag is accepted.
// Anything else is treated as a bad response, here and in src/data/release-assets.ts.
export const RELEASE_TAG = /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?$/;

async function getJson(path: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${API}${path}`, {
    headers: {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "coregeth.com-build",
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${API}${path}`);
  return (await response.json()) as Record<string, unknown>;
}

async function fromGitHub(): Promise<RepositoryFacts> {
  const [repo, release] = await Promise.all([getJson(""), getJson("/releases/latest")]);
  const { description } = repo;
  const tag = release.tag_name;
  if (typeof description !== "string") {
    throw new Error("unexpected repository fields in the API response");
  }
  if (typeof tag !== "string" || !RELEASE_TAG.test(tag)) {
    throw new Error("unexpected release tag in the API response");
  }
  return {
    description,
    release: { tag },
    source: "github",
  };
}

function fromSnapshot(reason: unknown): RepositoryFacts {
  const why = reason instanceof Error ? reason.message : String(reason);
  console.warn(
    `[coregeth.com] GitHub API unavailable (${why}); the build uses src/data/repository-snapshot.json, as of ${snapshot.asOf}.`,
  );
  return {
    description: snapshot.description,
    release: { tag: snapshot.releaseTag },
    source: "snapshot",
  };
}

let facts: Promise<RepositoryFacts> | undefined;

/** One API read per build, shared by every page that renders the facts. */
export function getRepository(): Promise<RepositoryFacts> {
  facts ??= fromGitHub().catch(fromSnapshot);
  return facts;
}

/**
 * A YYYY-MM-DD date in the site's one visible format, American order, for example
 * "March 8, 2026" (maintainer decision, 2026-10-08). Every visible date reads this way:
 * the timelines, the census caption and the records. An ISO date stays in the `datetime`
 * attribute, where it is for machines rather than readers.
 */
export function formatAsOf(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
