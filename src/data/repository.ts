/**
 * The repository card's facts: description, stars, forks and the latest release.
 *
 * Read from the GitHub API once per build, never in the visitor's browser, so a
 * page view makes no request to GitHub and no third party learns who is reading.
 * The numbers are therefore as of the last build, and the card says so.
 *
 * If the API cannot be reached, is rate limited, or returns something unexpected,
 * the build falls back to repository-snapshot.json, the last known values, and the
 * card shows that file's date instead of the build's. Refresh the snapshot by hand
 * when the counts have moved; the command is in AGENTS.md.
 */
import snapshot from "./repository-snapshot.json";
import { REPO } from "./site";

export interface RepositoryFacts {
  description: string;
  stars: number;
  forks: number;
  release: { tag: string };
  /** The UTC date these values were read from GitHub, as YYYY-MM-DD. */
  asOf: string;
  source: "github" | "snapshot";
}

const API = `https://api.github.com/repos/${REPO.slug}`;

// A release tag is shown on the card and in the header, so only a plain version tag
// is accepted. Anything else is treated as a bad response and the snapshot is used.
const RELEASE_TAG = /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?$/;

const isCount = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) >= 0;

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
  const { description, stargazers_count: stars, forks_count: forks } = repo;
  const tag = release.tag_name;
  if (typeof description !== "string" || !isCount(stars) || !isCount(forks)) {
    throw new Error("unexpected repository fields in the API response");
  }
  if (typeof tag !== "string" || !RELEASE_TAG.test(tag)) {
    throw new Error("unexpected release tag in the API response");
  }
  return {
    description,
    stars,
    forks,
    release: { tag },
    asOf: new Date().toISOString().slice(0, 10),
    source: "github",
  };
}

function fromSnapshot(reason: unknown): RepositoryFacts {
  const why = reason instanceof Error ? reason.message : String(reason);
  console.warn(
    `[coregeth.com] GitHub API unavailable (${why}); the repository card uses src/data/repository-snapshot.json, as of ${snapshot.asOf}.`,
  );
  return {
    description: snapshot.description,
    stars: snapshot.stars,
    forks: snapshot.forks,
    release: { tag: snapshot.releaseTag },
    asOf: snapshot.asOf,
    source: "snapshot",
  };
}

let facts: Promise<RepositoryFacts> | undefined;

/** One API read per build, shared by every page that renders the facts. */
export function getRepository(): Promise<RepositoryFacts> {
  facts ??= fromGitHub().catch(fromSnapshot);
  return facts;
}

/** A YYYY-MM-DD date as the card prints it, for example "September 18, 2026". */
export function formatAsOf(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
