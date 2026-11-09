/**
 * The peer discovery the `v1.13` line ships: its bootnodes and its three DNS discovery lists for each
 * network, read once per build from `params/bootnodes_classic.go` and `params/bootnodes_mordor.go` on
 * `main` in `ethereumclassic/core-geth`, never in a visitor's browser. The guide for a `v1.12` node
 * that cannot move yet gives that node the same bootnodes and lists (maintainer, 2026-11-08), so a pull
 * request that changes either moves the guide's commands at this site's next build, with no edit here.
 *
 * If either file cannot be read, or a network has no bootnodes or not exactly three lists, the build
 * logs a warning and uses discovery-snapshot.json, the last values read, both networks together, so a
 * page never mixes two readings. Refresh it by hand when `main` changes the files.
 */
import snapshot from "./discovery-snapshot.json";
import { REPO } from "./site";

export interface NetworkDiscovery {
  /** The three DNS discovery lists, in the order the params file declares them. */
  lists: string[];
  /** The bootnodes, as `--bootnodes` takes them. */
  bootnodes: string[];
}

export interface Discovery {
  classic: NetworkDiscovery;
  mordor: NetworkDiscovery;
  source: "live" | "snapshot";
}

const PARAMS = `https://raw.githubusercontent.com/${REPO.slug}/main/params`;

async function read(file: string): Promise<string> {
  const url = `${PARAMS}/${file}`;
  const response = await fetch(url, {
    headers: { "user-agent": "coregeth.com-build" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  return response.text();
}

// The lists are declared one per line, as `dnsPrefixETC` plus a domain, and the bootnodes as the
// quoted strings of one slice.
function network(go: string, prefix: string, name: "Classic" | "Mordor"): NetworkDiscovery {
  const slice = new RegExp(`var ${name}Bootnodes = \\[\\]string\\{([^}]*)\\}`).exec(go)?.[1] ?? "";
  const bootnodes = [...slice.matchAll(/"(enode:\/\/[0-9a-f]{128}@[^"]+)"/g)].map((m) => m[1]!);
  const lists = [
    ...go.matchAll(new RegExp(`${name}DNSNetwork\\d = dnsPrefixETC \\+ "([^"]+)"`, "g")),
  ].map((m) => prefix + m[1]);
  if (!bootnodes.length) throw new Error(`main's params name no ${name} bootnodes`);
  if (lists.length !== 3)
    throw new Error(`main's params name ${lists.length} ${name} lists, not 3`);
  return { lists, bootnodes };
}

async function live(): Promise<Discovery> {
  const [classic, mordor] = await Promise.all([
    read("bootnodes_classic.go"),
    read("bootnodes_mordor.go"),
  ]);
  const prefix = /var dnsPrefixETC = "(enrtree:\/\/[A-Z2-7]+@)"/.exec(classic)?.[1];
  if (!prefix) throw new Error("no dnsPrefixETC in main's params/bootnodes_classic.go");
  return {
    classic: network(classic, prefix, "Classic"),
    mordor: network(mordor, prefix, "Mordor"),
    source: "live",
  };
}

function fromSnapshot(reason: unknown): Discovery {
  const why = reason instanceof Error ? reason.message : String(reason);
  console.warn(
    `[coregeth.com] The v1.13 line's bootnodes and lists unavailable (${why}); the build uses src/data/discovery-snapshot.json, as of ${snapshot.asOf}.`,
  );
  return { classic: snapshot.classic, mordor: snapshot.mordor, source: "snapshot" };
}

let discovery: Promise<Discovery> | undefined;

/** One read of each file per build, shared by every page that names them. */
export function getDiscovery(): Promise<Discovery> {
  discovery ??= live().catch(fromSnapshot);
  return discovery;
}
