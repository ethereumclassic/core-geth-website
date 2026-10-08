/**
 * The repository card's facts: description, watchers, forks, stars and the latest release.
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
  /** GitHub's `subscribers_count`, the number the Watch button shows. Not
   *  `watchers_count`, which the API still returns as a copy of the star count. */
  watchers: number;
  forks: number;
  stars: number;
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
  const {
    description,
    stargazers_count: stars,
    forks_count: forks,
    subscribers_count: watchers,
  } = repo;
  const tag = release.tag_name;
  if (typeof description !== "string" || !isCount(stars) || !isCount(forks) || !isCount(watchers)) {
    throw new Error("unexpected repository fields in the API response");
  }
  if (typeof tag !== "string" || !RELEASE_TAG.test(tag)) {
    throw new Error("unexpected release tag in the API response");
  }
  return {
    description,
    watchers,
    forks,
    stars,
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
    watchers: snapshot.watchers,
    forks: snapshot.forks,
    stars: snapshot.stars,
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

/**
 * A YYYY-MM-DD date in the site's one visible format, American order, for example
 * "March 8, 2026" (maintainer decision, 2026-10-08). Every visible date reads this way:
 * the timelines, the census caption, the records and the repository card. An ISO date
 * stays in the `datetime` attribute, where it is for machines rather than readers.
 */
export function formatAsOf(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
