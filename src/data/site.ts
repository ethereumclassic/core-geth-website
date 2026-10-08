/**
 * The one data module for coregeth.com.
 *
 * The page, the head metadata, the JSON-LD and /llms.txt all read from here, so a
 * URL, a name or a sentence used by two of them cannot disagree between them.
 *
 * Every fact about Core-Geth here is taken from a page on docs.coregeth.com, which
 * owns it. Anything that changes with a release is deliberately absent: version
 * numbers, advisory counts, fork schedules and node figures belong to the pages that
 * maintain them, and a second copy here would go stale without anyone noticing. Link
 * the page instead. The exceptions, each set where it is defined:
 * - The repository card, whose release tag and counts are read from GitHub at build
 *   time (src/data/repository.ts).
 * - The MESS operator action, which names the release that ships MESS on, in the
 *   maintainer's wording.
 * - NETWORK_RUNNING, the network table, dated and sourced where it is set.
 */

export const SITE_URL = "https://coregeth.com";
export const SITE_NAME = "Core-Geth";

/** The line under the name, in the hero and in the footer: the README's own heading for
 *  the client, with the article the repository's description uses. */
export const TAGLINE_SHORT = "an Ethereum Classic execution client";

/** The home page's title, the README's own heading for the client. Other pages use
 *  "<page> - Core-Geth", as the documentation does. */
export const HOME_TITLE = "Core-Geth: Ethereum Classic Execution Client";

/**
 * The header and footer bar color, which the browser also uses for its own chrome.
 * Keep it equal to --bar in src/styles/global.css.
 */
export const THEME_COLOR = "#14151a";

/**
 * Default meta description, and the Open Graph and Twitter one. Under 160 characters,
 * so a search result shows it whole. It names what the page covers, in its order.
 */
export const SITE_DESCRIPTION =
  "Core-Geth is a production execution client for the Ethereum Classic network. Run an ETC or Mordor node, and find its releases, guides and security audits.";

/** Alt text for the social card, the same words the documentation uses for it. */
export const SOCIAL_CARD = {
  path: "/social-card.png",
  width: 1200,
  height: 630,
  alt: "Core-Geth, a production execution client for the Ethereum Classic network",
} as const;

export const REPO = {
  slug: "ethereumclassic/core-geth",
  url: "https://github.com/ethereumclassic/core-geth",
  releasesUrl: "https://github.com/ethereumclassic/core-geth/releases",
  /** GitHub's address for the newest release: a link to it lands on a release the moment
   *  it ships, where a tag link would keep pointing at the old one. */
  latestUrl: "https://github.com/ethereumclassic/core-geth/releases/latest",
  /**
   * The card's three counts link to where a reader can act on them. **Only forking has a
   * URL that does anything**: GitHub starts a fork from a plain link, while starring and
   * watching are POST actions with no GET equivalent, and `/stargazers` and `/watchers`
   * answer 404 to a signed-out visitor (measured 2026-10-08, with
   * `ethereum/go-ethereum/stargazers` as the control, which 404s the same way). So those
   * two link to the repository, where their buttons are.
   */
  forkUrl: "https://github.com/ethereumclassic/core-geth/fork",
} as const;

/**
 * The release line the page recommends, never a single release: a patch inside the
 * line then ships without editing the site, because every download link is
 * `REPO.latestUrl` and the card reads its version from GitHub at build time. The
 * network table is the one place an exact release is named, since its rows are a
 * census counted on a date. `NETWORK_RUNNING` fails the build if its recommended row
 * leaves this line.
 */
export const RECOMMENDED_LINE = "v1.13";

/**
 * The release line the audits found exposed, and the one most operators are searching
 * for when they arrive at `/security/`. It is history rather than a recommendation, so
 * naming it is the same exception the census rows take: a reader who runs `v1.12.22`
 * searches that line, and a page that will not say it does not reach them.
 */
export const EXPOSED_LINE = "v1.12";

/**
 * The last stable release before the maintenance gap. One constant, because the records
 * band and the release timeline both name it and a record disagreeing with the timeline
 * above it is worse than neither naming it. A development build published later is not a
 * release, which is why this says stable.
 */
export const LAST_RELEASE_BEFORE_GAP = "v1.12.20";

/**
 * The repository releases used to come from: the one the March 2026 security audit
 * audited, and the one the project history says went unfunded and unmaintained.
 */
export const PREVIOUS_REPO = "etclabscore/core-geth";

export const DOCS_URL = "https://docs.coregeth.com/";

/** The documentation site's own name, its `site_name` in mkdocs.yml. */
export const DOCS_SITE_NAME = "Core-Geth Documentation";

/**
 * The operating systems the documentation's Running a node guide covers ("a guide for
 * Linux, macOS, Windows and Docker"). Docker is a way to run it, not an operating
 * system, so it is not listed here.
 */
export const PLATFORMS: readonly string[] = ["Linux", "macOS", "Windows"];

export interface DocPage {
  href: string;
  title: string;
  /** One line for /llms.txt, following the documentation's own llms.txt wording. */
  summary: string;
}

/** The documentation pages this site links to. */
export const DOCS = {
  home: {
    href: DOCS_URL,
    title: "Documentation home",
    summary: "what this client is, which networks it supports, and where to go first.",
  },
  operators: {
    href: `${DOCS_URL}operators/`,
    title: "Node operators: start here",
    summary:
      "the short path for node, pool, exchange and RPC operators: what to do now, and what to read in what order.",
  },
  installation: {
    href: `${DOCS_URL}getting-started/installation/`,
    title: "Installation",
    summary: "download, checksum and install a release.",
  },
  history: {
    href: `${DOCS_URL}about/project-history/`,
    title: "Project history",
    summary:
      "the lineage of the code, from go-ethereum through multi-geth, and of the organizations that funded and maintained it.",
  },
  securityAudit: {
    href: `${DOCS_URL}audits/2026-03-security-audit/`,
    title: "March 2026 security audit",
    summary:
      "the audit of the client's source, with the per-release breakdown and the disclosure timeline.",
  },
  goToolchain: {
    href: `${DOCS_URL}audits/2026-09-go-toolchain/`,
    title: "Go toolchain audit",
    summary:
      "which Go toolchain built each published archive, and the standard library advisories each one carries.",
  },
  releaseReport: {
    href: `${DOCS_URL}release-reports/v1.13.0/`,
    title: "Release report",
    summary: "what the release fixes, what it changes, and how to verify a download.",
  },
  support: {
    href: `${DOCS_URL}support/`,
    title: "Support this work",
    summary: "how this client's maintenance is funded, and the routes for sponsoring it.",
  },
  guides: {
    href: `${DOCS_URL}guides/`,
    title: "Choose your role",
    summary: "the starting page for each kind of node, from a personal node to a mining pool.",
  },
  developerEndpoints: {
    href: `${DOCS_URL}guides/developer-endpoints/`,
    title: "Endpoints for your own project",
    summary:
      "running your own JSON-RPC and archive endpoints for an application you are building, and getting Mordor test coins by mining rather than from a faucet.",
  },
  transition: {
    href: `${DOCS_URL}etc-cooperative-transition/`,
    title: "The ETC Cooperative transition",
    summary:
      "where the services the ETC Cooperative maintained continue as it winds down, including the public JSON-RPC endpoints and the peer discovery lists.",
  },
  migration: {
    href: `${DOCS_URL}tutorials/v1.13.0-migration/`,
    title: "Migration guide",
    summary: "what changes on upgrade, per platform, and the steps a node needs.",
  },
  buildFromSource: {
    href: `${DOCS_URL}developers/build-from-source/`,
    title: "Build from source",
    summary: "what a build needs, and the commands.",
  },
  versioning: {
    href: `${DOCS_URL}developers/versioning/`,
    title: "Versioning",
    summary: "what the version string and its release stage mean.",
  },
  messSetting: {
    href: `${DOCS_URL}operate/mess/#which-setting-fits-which-operator`,
    title: "Which setting fits which operator",
    summary: "the MESS trade for each kind of operator.",
  },
  faq: {
    href: `${DOCS_URL}about/faq/`,
    title: "Questions and answers",
    summary:
      "which repository publishes releases, which version to run, why node key rotation is required, public RPC endpoints and how to verify a download.",
  },
} as const satisfies Record<string, DocPage>;

/**
 * Where to start for each kind of node, from the "Choose your role" table on the
 * documentation's guides page: its own words for each role, and its "Start with" page.
 */
export const GUIDES: readonly { role: string; title: string; href: string }[] = [
  {
    role: "Running a node for yourself or a wallet",
    title: "Installation",
    href: DOCS.installation.href,
  },
  {
    role: "An exchange or custodian",
    title: "Production operations",
    href: `${DOCS_URL}guides/production-operations/`,
  },
  { role: "A solo miner", title: "Mining", href: `${DOCS_URL}guides/mining/` },
  {
    role: "A mining pool operator",
    title: "Mining pool node",
    href: `${DOCS_URL}guides/mining-pool-node/`,
  },
  {
    role: "An RPC provider",
    title: "Public RPC endpoint",
    href: `${DOCS_URL}guides/public-rpc-endpoint/`,
  },
  {
    role: "Building an application on Ethereum Classic",
    title: DOCS.developerEndpoints.title,
    href: DOCS.developerEndpoints.href,
  },
  {
    role: "An explorer, indexer or analytics service",
    title: "Archive node",
    href: `${DOCS_URL}guides/archive-node/`,
  },
  {
    role: "Testing on Mordor",
    title: "Run a Mordor node",
    href: `${DOCS_URL}getting-started/run-mordor-node/`,
  },
];

/** The transition, in the words the transition page opens with. */
export const TRANSITION = {
  lede: "The ETC Cooperative is winding down, and the services it maintained are moving to the `ethereumclassic` GitHub organization: the Core-Geth client, the peer discovery lists, the bootnodes and public JSON-RPC.",
  advice:
    "The peer discovery lists are how a node finds its first peers. `v1.13` reads the `ethereumclassic` organization's lists by default, and a `v1.12.x` node switches to them with one flag. Before you move a node, a pool or an application to a new source of software or data, confirm which organization publishes it.",
} as const;

export interface Network {
  name: string;
  chainId: number;
  role: string;
  /** The flag that selects the network, from the documentation's supported networks table. */
  flag: string;
  /** The documentation's guide for running a node on this network. */
  guide: { href: string; title: string };
}

export const NETWORKS: readonly Network[] = [
  {
    name: "Ethereum Classic",
    chainId: 61,
    role: "mainnet",
    flag: "--classic",
    guide: {
      href: `${DOCS_URL}getting-started/run-classic-node/`,
      title: "Run an Ethereum Classic node",
    },
  },
  {
    name: "Mordor",
    chainId: 63,
    role: "test network",
    flag: "--mordor",
    guide: {
      href: `${DOCS_URL}getting-started/run-mordor-node/`,
      title: "Run a Mordor node",
    },
  },
];

/**
 * The four actions the operators page opens with. Each links there, and each carries one
 * line of its own (maintainer, 2026-10-08): an action a reader cannot weigh without
 * opening another page is not an action. Every line is the operators page's or the
 * migration guide's, shortened, never reasoned out here. `code` is set in monospace
 * after `text`; `detail` is a line beneath it, with backticks marking code.
 */
export const OPERATOR_ACTIONS: readonly {
  text: string;
  code?: string;
  detail?: string;
  href?: string;
}[] = [
  {
    text: `Upgrade to the ${RECOMMENDED_LINE} line`,
    detail:
      "Your chain data carries over, and the upgrade costs about twenty minutes of downtime. The migration guide has a path for each platform.",
  },
  {
    text: "Rotate the P2P node key",
    detail: `Required if your node ran the \`${EXPOSED_LINE}\` line: one of the flaws in that line leaks bits of that key across repeated handshakes, and no fix can take back what already leaked. A key that has only ever run \`${RECOMMENDED_LINE}\` was never exposed, so a fresh install skips this step.`,
  },
  {
    text: "Track releases at ",
    code: REPO.slug,
    detail: `Releases are published from \`${REPO.slug}\`. Anything still watching \`${PREVIOUS_REPO}\`, a script or a mirror, will not see a new release.`,
  },
  {
    text: "Decide the MESS setting",
    detail:
      "`--mess` turns it on and `--mess=false` turns it off; without either, a node uses the setting its release ships with. Every node you run should carry the same one.",
    href: DOCS.messSetting.href,
  },
];

/**
 * What the network is running: Core-Geth nodes by release, from "What the network is
 * running" in the documentation's v1.13.0 record, counted by etcnodes.org on the date
 * in `measured`. By the maintainer's decision (2026-09-18) this is the one section that
 * states census figures, advisory counts and versions, each dated and sourced here. A
 * re-measure is an edit to this block: the shares and the total are computed from the
 * counts. `status` is the state each row carries in text as well as in color.
 * Backticks mark code.
 */
const NETWORK_ROWS: readonly {
  running: string;
  nodes: number;
  status: "exposed" | "recommended";
  /** The tally in the row: counts, in the same shape for every release. */
  summary: string;
  /** What that release carries, under the row and collapsible. */
  detail: string;
}[] = [
  {
    running: "`v1.12.20` and older",
    nodes: 158,
    status: "exposed",
    summary:
      "6 client CVEs open, 62 known Go flaws with 48 in the binary, GraphQL queries unbounded",
    detail:
      "Every one of the six flaws found in the client's own code is unpatched here, and two of them were used against the ETC Cooperative's bootnodes in March 2026. It was also built with Go 1.21, a version the Go project has since published 62 security fixes for: in 48 of them the flawed code is compiled into the binary you would be running. Whether a node can be made to reach that code was not tested, so treat it as exposure to rule out rather than proven.",
  },
  {
    running: "`v1.12.21`",
    nodes: 50,
    status: "exposed",
    summary:
      "4 client CVEs open, 62 known Go flaws with 48 in the binary, GraphQL queries unbounded",
    detail:
      "Closes the two handshake encryption flaws, CVE-2026-22862 and CVE-2026-26315, and caps the size of a handshake message. Four flaws stay open: CVE-2025-24883, CVE-2026-26314, CVE-2026-26313 and CVE-2026-22868. A GraphQL query can still nest without limit, which can exhaust a node that serves it, and the Go build is the same as above.",
  },
  {
    running: "`v1.12.22`",
    nodes: 165,
    status: "exposed",
    summary:
      "1 client CVE open and 1 only mitigated, 62 known Go flaws with 48 in the binary, GraphQL queries unbounded, `eth_syncing` regression",
    detail:
      "Adds the key checks for CVE-2025-24883 and CVE-2026-26314. For CVE-2026-26313 its own commit says mitigation rather than fix: the node stops a peer exhausting its memory, but still reads the whole message, so the attack still costs it work. CVE-2026-22868 was called not applicable to Ethereum Classic and left unpatched, though the same binary also serves Ethereum, Sepolia and Holesky, where the affected feature is switched on. This release is also where `eth_syncing` starts reporting the wrong sync height, reported in `etclabscore/core-geth` as issue #697 and still open. Same Go build as above.",
  },
  {
    running: "`v1.12.23`",
    nodes: 138,
    status: "exposed",
    summary:
      "1 client CVE open and 1 only mitigated, 62 known Go flaws with 48 in the binary, GraphQL queries unbounded, `eth_syncing` regression",
    detail:
      "Hardens how peer messages are decoded, and adds a cap on snap sync responses that can disconnect peers which are answering correctly. What stays open: CVE-2026-26313 is still only mitigated, CVE-2026-22868 still unpatched, GraphQL queries still unbounded, and `eth_syncing` still wrong, its report still open. Its archives were built with Go 1.21.13 or Go 1.22.1, versions the Go project had already stopped supporting when this shipped, and every one of the 62 Go fixes above was published before the release date.",
  },
  {
    running: "`v1.13.0`",
    nodes: 9,
    status: "recommended",
    summary: "every client CVE patched, a supported Go build, GraphQL queries bounded",
    detail:
      "All six flaws in the client's own code are patched, CVE-2026-22868 among them, and GraphQL queries are bounded. Built with Go 1.26.8, a supported version, so none of the 62 Go flaws above is in the binary. Released September 14, 2026, and the release report lists what is known to be imperfect in it.",
  },
];

/**
 * Counted but not listed: a development build of the previous repository's `master` is
 * not a release, so it is not a row. Its nodes stay in the total, which is the count the
 * record publishes. The caption no longer names them (maintainer, 2026-10-08): which
 * build the remainder ran is not something a reader needs. The guard below is what keeps
 * the rows and the measured total in step now that no sentence does.
 */
const NETWORK_UNLISTED = { nodes: 4, what: "an unreleased development build" } as const;
const NETWORK_TOTAL = 524;

const listed = NETWORK_ROWS.reduce((sum, row) => sum + row.nodes, 0);
if (listed + NETWORK_UNLISTED.nodes !== NETWORK_TOTAL) {
  throw new Error(
    `the census lists ${listed} nodes and excludes ${NETWORK_UNLISTED.nodes}, which is not the measured ${NETWORK_TOTAL}`,
  );
}
const networkShare = (nodes: number) => (nodes / NETWORK_TOTAL) * 100;
const recommendedRows = NETWORK_ROWS.filter((row) => row.status === "recommended");
const [recommended] = recommendedRows;
if (!recommended || recommendedRows.length !== 1) {
  throw new Error("NETWORK_RUNNING needs exactly one recommended release");
}
// The census names one release; the page recommends its line, so the two must agree.
if (!recommended.running.replaceAll("`", "").startsWith(`${RECOMMENDED_LINE}.`)) {
  throw new Error(`the recommended row is outside ${RECOMMENDED_LINE}`);
}

export const NETWORK_RUNNING = {
  measured: { iso: "2026-09-17", text: "September 17, 2026" },
  source: { label: "etcnodes.org", href: "https://etcnodes.org" },
  evidence: `${DOCS_URL}release-reports/v1.13.0-record/#what-the-network-is-running`,
  /** Where the Go advisory counts in the rows come from, which is a different audit. */
  goAdvisories: {
    label: "Where the Go figures come from",
    href: `${DOCS_URL}audits/2026-09-go-toolchain/`,
  },
  upgrade: { label: "Upgrade to the latest release", href: REPO.latestUrl },
  total: NETWORK_TOTAL,
  /** The line above the table: what the recommended line resolves, in the record's words
   *  for the release it measured, and the maintainer's recommendation to run one beside the
   *  current nodes before moving a whole fleet across. The trial node takes no traffic: the
   *  migration guide asks for one MESS setting per fleet, and `v1.12.x` runs MESS off where
   *  this line turns it on. Check all of it against the documentation whenever the
   *  recommended line changes. */
  lede: `The \`${RECOMMENDED_LINE}\` line patches all six flaws the audits found in the \`${EXPOSED_LINE}\` client code, bounds GraphQL queries and is built with a supported Go version, so none of the 62 Go flaws the \`${EXPOSED_LINE}\` builds carry is in it. Run a \`${RECOMMENDED_LINE}\` node beside your current ones without sending it traffic, and when you are comfortable, move your whole fleet to it.`,
  rows: NETWORK_ROWS.map((row) => ({ ...row, share: `${networkShare(row.nodes).toFixed(1)}%` })),
} as const;

/**
 * What Core-Geth is. The definition and the upstream line are the documentation
 * home's; `oneNode` is "What this runs" in Run an Ethereum Classic node. The
 * definition is also the JSON-LD description. Backticks mark code.
 */
export const ABOUT = {
  definition:
    "Core-Geth is an execution client for Ethereum Classic: the software that holds the chain, validates every block and answers the JSON-RPC calls an application makes. It is a go-ethereum downstream that keeps chain configuration as data rather than hard-coded, so one binary serves Ethereum Classic, Mordor, MintMe and private chains.",
  maintained:
    "Core-Geth is a reference client for Ethereum Classic, kept as a public good in the `ethereumclassic` GitHub organization, the same convention [`bitcoin/bitcoin`](https://github.com/bitcoin/bitcoin) follows for Bitcoin and [`ethereum/go-ethereum`](https://github.com/ethereum/go-ethereum) for Ethereum. It carries Ethereum Classic's consensus rules itself, every fork from Frontier through Spiral, because go-ethereum does not.",
  oneNode:
    "Running `geth` is running a complete Ethereum Classic node: it finds peers, syncs the chain, validates every block it receives, and serves the result to whatever you point at it.",
} as const;

/**
 * What the client does, in the row a reader scans before deciding to run it: the pattern
 * every other execution client's page uses. Each line is one claim and routes to the
 * documentation page that carries it, so nothing here has to be maintained twice.
 */
export const CAPABILITIES: readonly {
  heading: string;
  body: string;
  /** The claim in its shortest checkable form, set in the code face under the sentence. */
  evidence: string;
  link: { label: string; href: string };
}[] = [
  {
    heading: "Networks",
    body: "Run Ethereum Classic, the Mordor test network, MintMe or a private chain from the same binary. A flag picks the network.",
    evidence: "chain 61 / chain 63 / chain 24734 / your own genesis",
    link: { label: "Command line", href: `${DOCS_URL}getting-started/run-cli/` },
  },
  {
    heading: "Sync modes",
    body: "Snap sync to catch up quickly, full sync to replay every block yourself, archive when you need every historical state on hand.",
    evidence: "--syncmode snap / --syncmode full / --gcmode archive",
    link: { label: "Sync modes", href: `${DOCS_URL}operate/sync-modes/` },
  },
  {
    heading: "JSON-RPC",
    body: "Serve wallets, explorers and indexers over HTTP, WebSocket and IPC, with the namespaces they expect and IPC on by default.",
    evidence: "--http / --ws / IPC on by default",
    link: { label: "JSON-RPC API", href: `${DOCS_URL}JSON-RPC-API/` },
  },
  {
    heading: "Platforms",
    body: "Linux, macOS and Windows, on x86-64 and Arm, plus a container image for a host that already runs one.",
    evidence: "9 platforms per release, each with a checksum and an attestation",
    link: { label: "Installation", href: `${DOCS_URL}getting-started/installation/` },
  },
  {
    heading: "Monitoring",
    body: "Scrape metrics in the Prometheus format or push them to InfluxDB, and read logs that tell you whether a node is healthy.",
    evidence: "--metrics / Prometheus / InfluxDB",
    link: { label: "Monitoring", href: `${DOCS_URL}operate/monitoring/` },
  },
  {
    heading: "Hardware",
    body: "What a full node and an archive node need in disk, memory and time to sync, measured rather than estimated.",
    evidence: "disk / memory / sync time, measured per network",
    link: {
      label: "Hardware requirements",
      href: `${DOCS_URL}getting-started/hardware-requirements/`,
    },
  },
];

/**
 * Which repository a release comes from, and which it does not. The second sentence dates
 * the move and attributes the proposal, not the act: the project history records that
 * `ethereumclassic/core-geth` was created on December 21, 2024 from the previous
 * repository's commit of December 16, and that the ETC Cooperative's published roadmap of
 * July 30, 2024 proposed the move. Nothing published says who performed it, so this does
 * not say either.
 */
export const PREVIOUS_NAMESPACE =
  "On December 21, 2024, Core-Geth maintenance moved to [`ethereumclassic/core-geth`](https://github.com/ethereumclassic/core-geth) from `etclabscore/core-geth`, as the ETC Cooperative's published roadmap on July 30, 2024 had proposed. Archives still published under `etclabscore/core-geth` are built from the older code and do not carry the `v1.13` fixes, so they are not a release to run: move to the latest `v1.13` release instead.";

/**
 * The two repository names, and the tone each takes wherever it appears on the site
 * (maintainer decision, 2026-10-08): the previous namespace in the muted red the network
 * table uses for an exposed release, this one in the page green. `InlineCode` applies
 * this map by default, so a sentence cannot name either one and come out untoned.
 *
 * Both the bare organization and the full slug are listed, because copy uses each.
 */
export const NAMESPACE_TONES: Readonly<Record<string, string>> = {
  etclabscore: "namespace--previous",
  [PREVIOUS_REPO]: "namespace--previous",
  ethereumclassic: "namespace--current",
  [REPO.slug]: "namespace--current",
};

/**
 * The three records the security section opens, in the maintainer's framing
 * (2026-09-18): the attack and the dormancy were `etclabscore/core-geth`'s, and
 * `ethereumclassic/core-geth` is the solution. Each summary is its page's own
 * account: the audit of `etclabscore/core-geth` and its "March 2026 attack on
 * the ETC Cooperative's bootnodes"; the toolchain audit, "a binary keeps its toolchain's
 * advisories for as long as it runs"; and the release that resolves every finding in
 * both. Backticks mark code.
 */
/**
 * The three records, in the order they happened and dated by what dates them: the
 * previous line's last release before the gap (`v1.12.20`, June 10, 2024), the attack on
 * the ETC Cooperative's bootnodes in March 2026, and the release that closed both
 * (`v1.13.0`, September 14, 2026). The labels are the maintainer's framing (2026-09-18).
 */
export const RECORDS: readonly {
  date: { month: string; year: string; iso: string };
  label: string;
  summary: string;
  page: DocPage;
  /** A button under the record, where the record is something a reader can act on. */
  cta?: { label: string; href: string };
}[] = [
  {
    date: { month: "Jun", year: "2024", iso: "2024-06" },
    label: "The dormancy",
    summary: `The last stable release from \`${PREVIOUS_REPO}\` was \`${LAST_RELEASE_BEFORE_GAP}\`, before 21 months of dormancy, through which contributors' issues and pull requests went unmerged. The emergency releases that eventually followed were still built on Go versions no longer supported. Go is compiled into the binary rather than loaded when it runs, so each of those archives carries 62 known Go security flaws for as long as the node is up, and nothing short of a new build removes them.`,
    page: DOCS.goToolchain,
  },
  {
    date: { month: "Mar", year: "2026", iso: "2026-03" },
    label: "The attack",
    summary: `Two of the flaws left unpatched through the gap were used against the ETC Cooperative's bootnodes in March 2026, in an attack on the Core-Geth \`${EXPOSED_LINE}\` line. Ethereum Classic core developers had resumed maintenance in \`${REPO.slug}\` the month before and had disclosed the fixes privately to the Cooperative, and \`${PREVIOUS_REPO}\` copied them into emergency \`${EXPOSED_LINE}\` releases while the \`${RECOMMENDED_LINE}\` line was built and tested in \`${REPO.slug}\` for the network to move to.`,
    page: DOCS.securityAudit,
  },
  {
    date: { month: "Sep", year: "2026", iso: "2026-09" },
    label: "The solution",
    summary: `\`${RECOMMENDED_LINE}.0\`, published from \`${REPO.slug}\`, fixes every flaw the audits found in the \`${EXPOSED_LINE}\` client code and returns the dependencies and the Go toolchain to supported versions. Every node still on a \`${EXPOSED_LINE}\` release should move to the \`${RECOMMENDED_LINE}\` line.`,
    page: DOCS.releaseReport,
    // The record's heading already links the release report, which is the document. This
    // button is for the reader who wants the client: /downloads/ carries the archive for
    // each platform with its checksum and the commands to install and run it, which the
    // GitHub release page does not (maintainer, 2026-10-08).
    cta: { label: "Download Core-Geth", href: "/downloads/" },
  },
];

/**
 * The client's own copyright and license, as the documentation's footer states
 * them. This site is licensed separately (Apache-2.0, see LICENSE and NOTICE), so
 * the footer attributes these to Core-Geth rather than to the page.
 */
export const CLIENT_LICENSE = {
  holders: "The go-ethereum Authors, The multi-geth Authors and The core-geth Authors",
  names: "the GNU GPL v3 and LGPL v3",
  files: [
    { label: "COPYING", href: `${REPO.url}/blob/main/COPYING` },
    { label: "COPYING.LESSER", href: `${REPO.url}/blob/main/COPYING.LESSER` },
  ],
} as const;

export const SECURITY_EMAIL = "security@ethereumclassic.net";
/**
 * The project's own short link, which `astro.config.mjs` forwards to the community's
 * maintained Discord page. Linking it rather than an invite code keeps the invite in one
 * place, so this site cannot hold a stale one.
 */
export const DISCORD_URL = "/discord";
export const ISSUES_URL = `${REPO.url}/issues`;
export const ADVISORIES_URL = `${REPO.url}/security/advisories`;
export const SECURITY_POLICY_URL = `${REPO.url}/blob/main/SECURITY.md`;

/** Where Ethereum Classic's public goods live: the client, the discovery lists that a node
 *  finds its first peers through, the bootnodes, the ECIPs and the website. */
export const ORG_URL = "https://github.com/ethereumclassic";

/**
 * Where each kind of message goes, from "Questions, and reporting something" on the
 * documentation's operators page. A vulnerability never goes to a public channel.
 */
export const CONTACT: readonly {
  heading: string;
  body: string;
  links: readonly { label: string; href: string }[];
}[] = [
  {
    heading: "Ask a question",
    body: "The Ethereum Classic Core Developers run a Discord for questions about running a node, an upgrade, or anything in the documentation.",
    links: [{ label: "Discord", href: DISCORD_URL }],
  },
  {
    heading: "Report a defect",
    body: "Defects belong in the repository's issues, where they are public and checkable.",
    links: [{ label: "Issues", href: ISSUES_URL }],
  },
  {
    heading: "Report a security issue",
    body: "Privately, never in a public issue or channel. A private advisory is the channel the policy prefers, and the address reaches the same people: one of the core developers who maintain this client.",
    links: [
      { label: "Private advisories", href: ADVISORIES_URL },
      { label: SECURITY_EMAIL, href: `mailto:${SECURITY_EMAIL}` },
      { label: "Security policy", href: SECURITY_POLICY_URL },
    ],
  },
];

/** Where sponsorship is arranged. The documentation's support page publishes the routes;
 *  this address is the one it names, and the one the discovery lists' page names. */
export const SPONSOR_EMAIL = "donations@ethereumclassic.net";

/**
 * The /sponsor page. Its shape and most of its wording follow the discovery lists'
 * support page and README, which are the project's own framing for this subject, scoped
 * here to the client: who maintains it, that the arrangement is new, who has paid, why it
 * needs sponsors, and what sponsorship does and does not buy. The routes themselves stay
 * published in one place, the documentation's support page, which this page links rather
 * than restates.
 */
export const SPONSOR = {
  intro:
    "It is the network's reference client, published from `ethereumclassic/core-geth` and kept in the `ethereumclassic` GitHub organization alongside the bootnodes and the peer discovery lists that nodes start from, so the software Ethereum Classic runs on belongs to the network rather than to whoever is paying for it that year.",
  maintainers: {
    heading: "Who maintains it",
    lede: "The client is maintained by Ethereum Classic's core developers and open community contributions, in the `ethereumclassic` GitHub organization. The Ethereum Classic DAO is the legal entity standing behind that work, and the floor under it when nobody else is paying.",
    /**
     * The maintainer and the place the software lives, each given its own panel and its
     * own route. The DAO is the entity a sponsor is dealing with, so it gets a button
     * rather than a word underlined in the middle of a paragraph.
     */
    entities: [
      {
        label: "Who does the work",
        icon: "people" as const,
        name: "Ethereum Classic Core Developers",
        // The GitHub team, shown so a reader can see a team rather than a person stands
        // behind the client. **Text, never a link** (maintainer, 2026-10-08): the team is
        // "closed", so its page sends a signed-out visitor to a login screen, measured
        // 2026-10-08 against a made-up team slug, which redirects the same way.
        handle: "@ethereumclassic/core-developers",
        body: "The work happens in public: pull requests anyone can read, and every repository in the `ethereumclassic` organization carries more than one admin and more than one maintainer, so no single person or employer is a point of failure.",
        cta: { label: "github.com/ethereumclassic", href: ORG_URL },
      },
      {
        label: "The legal wrapper",
        icon: "law" as const,
        name: "Ethereum Classic DAO",
        body: "A Wyoming DAO LLC, and what gives the network a legal counterpart when the world asks for one. Funding has to be received and reported in a tax jurisdiction, and an organization sponsoring the work has to contract with someone; neither is possible when the software belongs to no one in particular. The DAO carries those obligations and keeps the public goods from being captured by any individual or employer along the way. It does not control or lead Ethereum Classic, and it is not the only organization that can fund this work: it is the builder, maintainer and funder of last resort, the floor under the work rather than the hands doing it.",
        cta: { label: "ethereumclassicdao.org", href: "https://ethereumclassicdao.org" },
      },
    ],
    history:
      "Moving Ethereum Classic's public goods into the `ethereumclassic` GitHub organization began in 2024, through the ETC Cooperative's own efforts: its published roadmap of July 2024 proposed moving Core-Geth into that organization, and `ethereumclassic/core-geth` was created in December 2024. Before that move, the work passed from one organization to the next as each closed or left: ETCDEV in 2018, ETC Labs in 2021, and the ETC Cooperative, which [entered maintenance mode](https://etccooperative.org/etc-cooperative-retrospective-2024.pdf) at the end of 2024 and is due to dissolve by the end of 2026. Along the way the client changed repositories, the bootnodes and the peer discovery lists changed operators, and the `v1.12` line went 21 months without security maintenance in `etclabscore/core-geth`. What that cost is published in full, release by release and audit by audit: [the record is on the security page](/security/).",
  },
  funders: {
    heading: "Who has funded Ethereum Classic public goods",
    rows: [
      { years: "2016 to 2018", organization: "ETCDEV" },
      { years: "2019 to 2021", organization: "ETC Labs" },
      { years: "2017 to 2026", organization: "ETC Cooperative" },
      { years: "2025 to present", organization: "Ethereum Classic DAO" },
    ],
    note: "Each span is the years that organization funded Ethereum Classic public goods, which is longer than the years it funded Core-Geth. The Ethereum Classic DAO funds this work today as the funder of last resort, and the maintenance itself is done by Ethereum Classic's core developers and open community contributions. Sponsors are credited on the documentation's support page, with a name, a link and the years contributed, and only when they want to be.",
  },
  why: {
    heading: "Why sponsor public goods",
    body: [
      "If you are a stakeholder of Ethereum Classic, you rely on this client. Mining pools, centralized exchanges and custodians, issuers of Ethereum Classic financial products, mining hardware manufacturers, block explorers and RPC providers all depend on a client that follows the network and receives security fixes promptly. Ethereum Classic has no protocol-layer funding mechanism for its critical infrastructure or its core developers, so no part of the network's fee or issuance revenue pays for this work.",
      "This is not hypothetical. Three times the organization paying for the work has left, and the last time the `v1.12` line went 21 months without security maintenance: the flaws the March 2026 audit found were still open when two of them were used against the ETC Cooperative's bootnodes. Keeping the software in the `ethereumclassic` organization is meant to stop the next handover costing the same.",
      "Ethereum Classic's core developers maintain the client today, and the Ethereum Classic DAO is the legal entity behind them and the funder of last resort, whose commitment is that the network is never again left without security maintenance. A last resort is a floor rather than a plan: what the work needs is steady funding from the stakeholders who depend on it, so that it no longer rests on a single backer.",
    ],
  },
  routes: {
    heading: "How to sponsor",
    items: [
      {
        title: "An invoiced agreement, for organizations",
        body: "A maintenance sponsorship can be invoiced against a purchase order like any other vendor relationship, which is usually what a finance department needs. Write with what you run and the period you want to cover.",
      },
      {
        title: "A direct transfer",
        body: "The maintainers provide an address on request. If a large transfer is planned, send a small one first and confirm receipt at the same address.",
      },
      {
        title: "Every route starts at the sponsorship address",
        body: "A transfer address is only ever sent in a reply from that address. One shown to you in a screenshot, a fork, a mirror or any other message came from somewhere else.",
      },
    ],
  },
  pays: {
    heading: "What sponsorship pays for",
    body: "Keeping a consensus client fit to run a live network: tracking upstream security fixes and deciding which apply to Ethereum Classic, cutting and verifying releases across nine platforms, running the bootnodes and publishing the peer discovery lists the network bootstraps from, and measuring what the published binaries actually contain. The audits are the record of that work, including what was found broken and what it took to fix.",
  },
  notBuy: {
    heading: "What sponsorship does not buy",
    body: "No influence over consensus rules, release content, or what an audit reports. Chain configuration follows the ECIP process, and every finding this project publishes is measured and linked so it can be checked without trusting either the maintainers or anyone who funds them. A sponsor gets the same client as everyone else, on the same schedule. Being credited records a contribution; it is not an endorsement of the sponsor's products or services.",
  },
} as const;

/**
 * The project history, for `/about/`. Every entry is the documentation's own, from
 * `docs/about/project-history.md`: the code's lineage, then the organizations that led or
 * funded the work, then the move to the `ethereumclassic` organization. Dates are that page's.
 *
 * Nothing here is a summary of the documentation written from memory. If an entry needs
 * changing, change it there first and bring the wording across.
 */
export interface HistoryEntry {
  /** What the entry is, as a reader scans the rail: a year, a span or a date. */
  when: string;
  /** Machine-readable where the entry is a single date, for `<time datetime>`. */
  iso?: string;
  title: string;
  body: string;
  link?: { label: string; href: string };
  /** A quotation, set under the entry's prose rather than inside it. `kicker` labels
   *  what kind of document it is, `attribution` sits on the quotation itself, and
   *  `source` names the document, linked where it is published. */
  quote?: {
    kicker?: string;
    text: string;
    attribution: string;
    source: string;
    href?: string;
  };
  /** A button under the entry, where the entry is something a reader can act on now. */
  cta?: { label: string; href: string };
  /** The entry this project continues from, drawn in green rather than in the hairline. */
  current?: boolean;
}

export const CODE_LINEAGE: readonly HistoryEntry[] = [
  {
    when: "December 2013",
    title: "go-ethereum",
    link: { label: "ethereum/go-ethereum", href: "https://github.com/ethereum/go-ethereum" },
    body: "The Go implementation of the Ethereum protocol, and the code every client in this lineage descends from. Core-Geth's Go module path is still `github.com/ethereum/go-ethereum`, and every internal import uses it: deliberate downstream compatibility rather than a leftover.",
  },
  {
    when: "March 2018",
    title: "multi-geth",
    body: "Forked go-ethereum to serve several networks from one client, holding chain rules as configuration rather than as code branches. Sorpaas led its development from the start.",
    link: { label: "multi-geth", href: "https://github.com/multi-geth/multi-geth" },
  },
  {
    when: "2020",
    title: "Core-Geth",
    body: "Forked from multi-geth and kept its configuration model, which is what the client still runs on today. One binary serves Ethereum Classic, Mordor, MintMe and private chains.",
    link: { label: REPO.slug, href: REPO.url },
    current: true,
  },
];

export const ORGANIZATIONS: readonly HistoryEntry[] = [
  {
    // Before the 2016 split there was one chain and one client, so this entry is the only
    // one in the list that is not Ethereum Classic's own line. The project history starts
    // at ETCDEV, so this is cited to the Foundation rather than to this project's docs
    // (maintainer, 2026-10-08).
    when: "2014 to 2016",
    title: "Ethereum Foundation",
    body: "Built and maintained go-ethereum, the client both chains ran until Ethereum Classic began at the 2016 split. Everything after that split is Ethereum Classic's own line.",
    link: { label: "ethereum/go-ethereum", href: "https://github.com/ethereum/go-ethereum" },
  },
  {
    when: "2016 to 2018",
    title: "ETCDEV",
    body: "Supported Ethereum Classic's first clients, Classic Geth among them, in the legacy `ethereumproject` GitHub organization, from the Gas Reprice upgrade in October 2016 to Defuse Difficulty Bomb in May 2018. Left the ecosystem in 2018.",
    link: {
      label: "ethereumproject/go-ethereum",
      href: "https://github.com/ethereumproject/go-ethereum",
    },
  },
  {
    when: "2018 to 2020",
    title: "Sorpaas",
    body: "Led multi-geth's development from its start until 2020, and left the ecosystem then. Core-Geth was forked from multi-geth that year.",
    link: { label: "multi-geth/multi-geth", href: "https://github.com/multi-geth/multi-geth" },
  },
  {
    when: "2019 to 2021",
    title: "ETC Labs",
    body: "Led development from the Atlantis upgrade in 2019 to Magneto in 2021, through the fork and rebrand of multi-geth to Core-Geth, publishing as ETC Labs and ETC Core. Left the Ethereum Classic ecosystem in 2021, and `etclabscore/core-geth` passed to the ETC Cooperative, which owns it today.",
    link: { label: PREVIOUS_REPO, href: `https://github.com/${PREVIOUS_REPO}` },
  },
  {
    when: "2022 to 2024",
    title: "ETC Cooperative",
    body: `Funded and maintained Core-Geth from January 2022, at \`${PREVIOUS_REPO}\`, and maintained Ethereum Classic's other public goods: the peer discovery lists, the bootnodes and the public JSON-RPC endpoints. It [entered maintenance mode](https://etccooperative.org/etc-cooperative-retrospective-2024.pdf) at the end of 2024 and began transferring those public goods to the \`ethereumclassic\` GitHub organization. It stopped developing Core-Geth in 2025 and wound down its team, and its board has communicated that it is scheduled to dissolve by the end of 2026, with the public goods continuing in the \`ethereumclassic\` organization.`,
    link: { label: REPO.slug, href: REPO.url },
  },
  {
    when: "2024 onward",
    title: "The Ethereum Classic GitHub organization",
    body: "Created in July 2016, five days before the chain split, and the home of Ethereum Classic's public goods ever since: the ECIPs, the website, the peer discovery lists, and Core-Geth from December 2024. Every repository in it has more than one admin and more than one maintainer, so no single person or employer controls any of them.",
    link: { label: "github.com/ethereumclassic", href: ORG_URL },
  },
  {
    when: "2025",
    title: "Ethereum Classic DAO",
    body: "A Wyoming DAO LLC, launched in May 2025, and the legal entity behind Ethereum Classic's public goods. It paid for the 2026 modernization, which Ethereum Classic's core developers carried out, and it funds the work today as the funder of last resort. It does not do the maintenance.",
    link: { label: "ethereumclassicdao.org", href: "https://ethereumclassicdao.org" },
  },
  {
    when: "2026 onward",
    // The site's own framing, which is the client's maintainers and the repository they
    // work in rather than a firm (maintainer, 2026-10-08). **The site names no contractor
    // anywhere**: the audits record one, and a reader who opens them will meet it there.
    title: "Ethereum Classic core developers",
    body: `Maintain Core-Geth today, in \`${REPO.slug}\`. They resumed maintenance in February 2026, after the 21-month gap, carried out the security work on the \`${EXPOSED_LINE}\` line and disclosed it privately to the ETC Cooperative. In September 2026 they released the \`${RECOMMENDED_LINE}\` modernization, which cleared years of technical debt and the security issues still open in \`${EXPOSED_LINE}\`. Run the \`${RECOMMENDED_LINE}\` line, and track releases at \`${REPO.slug}\` from here on.`,
    link: { label: REPO.slug, href: REPO.url },
    current: true,
  },
];

/** The move to the `ethereumclassic` organization, which the repository section states in short. */
/**
 * The roadmap sentence that proposed the move, quoted in full because the reason it gives
 * is the point: sovereignty over the client, in the Cooperative's own words rather than
 * this project's. From `docs/about/project-history.md`, which cites the published post.
 */
export const REPOSITORY_MOVE_QUOTE = {
  kicker: "ROADMAP",
  // The colon is the published punctuation. A quotation is not repunctuated to read
  // better.
  text: "Move Core Geth to the Ethereum Classic community GitHub repository: This would restore sovereignty of the community on the node client software.",
  attribution: "ETC Cooperative, 2024",
  source: "Ethereum Classic Pathways, July 30, 2024",
  href: "https://ethereumclassic.org/blog/2024-07-30-ethereum-classic-pathways-by-etc-cooperative-istora-and-donald-mcIntyre",
} as const;

export const REPOSITORY_MOVE = {
  heading: "This repository",
  body: [
    "On December 21, 2024, Core-Geth maintenance moved to `ethereumclassic/core-geth` from `etclabscore/core-geth`, as the ETC Cooperative's published roadmap on July 30, 2024 had proposed.",
    "Documenting the ETC Cooperative handoff: the last commit before the move, December 16, 2024, is preserved on the [`archive-etclabscore-2024-12`](https://github.com/ethereumclassic/core-geth/tree/archive-etclabscore-2024-12) branch and [tagged](https://github.com/ethereumclassic/core-geth/releases/tag/archive%2Fetclabscore-2024-12), so the full history up to that point is intact and checkable. Keeping a reference client in the project's own organization is ordinary practice, as with Bitcoin Core at `bitcoin/bitcoin` and go-ethereum at `ethereum/go-ethereum`.",
  ],
} as const;

/**
 * The release history the security page draws as a rail: when each release shipped, which
 * repository published it, and what it left open. Every date, pull request number and
 * open item is the project history's timeline table, the March 2026 audit, the August
 * follow-up, the Go toolchain audit or the release record. Never reason one out here.
 *
 * It names exact releases and pull requests, which the copy standard otherwise reserves
 * for the census. That is deliberate and is the same exception for the same reason: this
 * is a dated record of what happened, not a recommendation, and a record without its
 * versions says nothing.
 *
 * The December 2024 entry links the archived commit by tag, which is a citation of a
 * preserved state rather than a download: the copy standard's rule that every release link
 * uses `REPO.latestUrl` is about getting the software, and that tag's own page says it is
 * not a release.
 *
 * **Each title names the repository that published it** (maintainer, 2026-10-08), in
 * backticks so the namespace tones apply: the emergency patches came from the previous
 * repository and the line that fixes them comes from this one, and a reader scanning the
 * rail cannot tell those apart from version numbers alone. **Each entry says what it left
 * open**, for the same reason: without that, the rail reads as four releases that each
 * fixed something, and three of them are not safe to run today.
 */
export const RELEASE_TIMELINE: readonly HistoryEntry[] = [
  {
    when: "June 10, 2024",
    iso: "2024-06-10",
    title: `\`${LAST_RELEASE_BEFORE_GAP}\` from \`${PREVIOUS_REPO}\``,
    body: `The last stable release from \`${PREVIOUS_REPO}\` before a 21-month gap in security maintenance, from June 2024 to February 2026. The last commit of any kind in that repository was a dependency bump in January 2025, and the private security disclosures sent to it through 2025 got no response.`,
  },
  {
    when: "December 21, 2024",
    iso: "2024-12-21",
    title: `Maintenance moves to \`${REPO.slug}\``,
    body: `The ETC Cooperative entered maintenance mode at the end of 2024, stopped developing Core-Geth in 2025 and wound down its team. \`${REPO.slug}\` was created on December 21, 2024 from the previous repository's commit of December 16, 2024, the move the Cooperative's own roadmap of July 2024 had proposed, and the history up to that commit is preserved in this repository on a tagged branch. It is the same client in the Ethereum Classic community's own organization, and no stakeholder took the maintenance up until February 2026, which is why the gap runs as long as it does.`,
    quote: {
      kicker: "RETROSPECTIVE",
      text: "it will be up to other stakeholders to take on any required maintenance of the ETC client",
      attribution: "ETC Cooperative, 2024",
      source: "ETC Cooperative 2024 retrospective",
      href: "https://etccooperative.org/etc-cooperative-retrospective-2024.pdf",
    },
    link: {
      label: "The commit it was created from",
      href: "https://github.com/ethereumclassic/core-geth/releases/tag/archive%2Fetclabscore-2024-12",
    },
  },
  {
    when: "February 2026",
    iso: "2026-02",
    title: `Maintenance resumes in \`${REPO.slug}\``,
    body: `Ethereum Classic core developers began work on the next release line in \`${REPO.slug}\`: the outstanding CVEs patched, a supported Go toolchain, the release pipeline rebuilt. The first patch was authored on February 26, and the line was tested on Ethereum Classic mainnet and Mordor from then until release.`,
  },
  {
    when: "February and March 2026",
    iso: "2026-03-04",
    title: "Private disclosure to the ETC Cooperative",
    body: `Ethereum Classic core developers reported the security work privately to the ETC Cooperative, which owns \`${PREVIOUS_REPO}\`, before publishing any of it. Nothing went public in \`${REPO.slug}\` until after the first emergency release was cut in the Cooperative's repository.`,
  },
  {
    when: "March 18, 2026",
    iso: "2026-03-18",
    title: `The bootnode attack on the Core-Geth \`${EXPOSED_LINE}\` line`,
    body: "Two of the flaws left open through the gap were used against the ETC Cooperative's bootnodes in production: a handshake crash loop, and an oracle that leaks bits of a node's P2P key across repeated handshakes. Every release published before March 18, 2026 carries both flaws.",
  },
  {
    when: "March 18, 2026",
    iso: "2026-03-18",
    title: `\`v1.12.21\` from \`${PREVIOUS_REPO}\``,
    body: `\`${PREVIOUS_REPO}\` cut this release about five hours after the attack was reported, from the patches Ethereum Classic core developers had disclosed privately to the ETC Cooperative in February and March 2026. It closed the two flaws used in the attack and capped the size of a handshake message, and left four known CVEs open. Its Go toolchains were unchanged and GraphQL queries still unbounded. Its release pull request was opened and merged by a single account in about 70 minutes, with no reviewer recorded.`,
  },
  {
    when: "March 20 and 21, 2026",
    iso: "2026-03-20",
    title: `The fixes are published in \`${REPO.slug}\``,
    body: "27 pull requests, #10 to #36, each scoped to a single change: a fix for each of the six CVEs, with a test and a linked advisory, plus the Go toolchain upgrade and the rebuilt release pipeline. Everything the rest of this page measures has been public since March 2026.",
  },
  {
    when: "March 28, 2026",
    iso: "2026-03-28",
    title: `\`v1.12.22\` from \`${PREVIOUS_REPO}\``,
    body: `\`${PREVIOUS_REPO}\` cut this release 95 seconds after its pull request opened, again with no reviewer recorded. It backported the remaining CVE fixes, though one of those CVEs was mitigated rather than fixed, and left the Go toolchains unchanged. It also introduced a regression in \`eth_syncing\`: a node reports the wrong network head, which misleads the exchanges, explorers and monitoring that read it to decide whether that node has finished syncing.`,
  },
  {
    when: "August 14, 2026",
    iso: "2026-08-14",
    title: `\`v1.12.23\` from \`${PREVIOUS_REPO}\``,
    body: `The last release from \`${PREVIOUS_REPO}\`, and still not one to run today. It hardened how peer messages are decoded and left everything else open: the \`eth_syncing\` regression untouched, GraphQL queries unbounded, the Go toolchains out of support, and a response cap added in that release which can disconnect peers that are answering correctly.`,
  },
  {
    when: "August 28, 2026",
    iso: "2026-08-28",
    title: "Bootnodes and peer discovery move to this organization",
    body: `A node finds its first peers through bootnodes and the peer discovery lists. \`ethereumclassic/discv4-dns-lists\` was created on August 28, 2026 to publish those lists from the \`ethereumclassic\` organization, the first crawl of the network followed on September 10, and \`${RECOMMENDED_LINE}.0\` ships with three Ethereum Classic and two Mordor bootnodes run by the Core-Geth maintainers and reads the new lists by default.`,
    link: {
      label: "ethereumclassic/discv4-dns-lists",
      href: "https://github.com/ethereumclassic/discv4-dns-lists",
    },
  },
  {
    when: "September 14, 2026",
    iso: "2026-09-14",
    title: `\`${RECOMMENDED_LINE}.0\` from \`${REPO.slug}\``,
    body: `Seven months of work, tested on Ethereum Classic mainnet and Mordor throughout: every flaw the audits found in the \`v1.12\` client code closed, GraphQL queries bounded, the \`eth_syncing\` regression fixed, and a supported Go toolchain. The release pipeline was rebuilt in \`${REPO.slug}\` too, so each archive names the machine it runs on and carries a checksum and a build attestation binding it to the workflow run that produced it. This repository has several maintainers with admin access and takes pull requests from anyone, which is what the previous repository's single-author emergency releases did not have.`,
    cta: { label: "Get the latest release", href: REPO.latestUrl },
    current: true,
  },
];

/**
 * How the 2026 work was handled, for `/security/`. Every sentence is the record's:
 * reported privately in February and March 2026, published as pull requests #10 to #36
 * on March 20 and 21, 2026, emergency releases cut in the previous repository on
 * March 18 and 28, 2026, and `v1.13.0` on September 14, 2026, nearly six months after
 * the fixes were public.
 *
 * The site said what was found and what it cost, and never said the project disclosed
 * before it published. That is the part a reader deciding whether to trust this work
 * needs most, so it has a section of its own rather than a clause in a timeline.
 */
export const DISCLOSURE = {
  heading: "The fixes were disclosed before they were published",
  body: [
    `The security work was reported privately to the ETC Cooperative, which owns \`${PREVIOUS_REPO}\`, in February and March 2026. It was published as 27 individually scoped pull requests on March 20 and 21, 2026, and the previous repository cut its emergency releases on March 18 and 28, 2026.`,
    `\`${RECOMMENDED_LINE}.0\` shipped on September 14, 2026, nearly six months after the fixes were public, and was tested on Ethereum Classic mainnet and Mordor throughout. Operators still on \`${EXPOSED_LINE}\` got relief first, in that line's own emergency releases, and were advised to move to the \`${RECOMMENDED_LINE}\` line once it shipped in September 2026.`,
  ],
  link: {
    label: "The disclosure timeline",
    href: `${DOCS_URL}audits/2026-03-security-audit/#disclosure-timeline`,
  },
} as const;

/**
 * The published audits and reports, for `/security/`. Each is a documentation page this
 * project publishes; the summaries say what each one covers, not what it concluded, so a
 * finding never gets restated here where it would go stale.
 *
 * **In the order they were published** (maintainer, 2026-10-08), each carrying its own
 * month so a reader can see how recent a finding is. **The month is the document's own
 * dating**, from its file name or the release it covers, never the day its file landed in
 * git: the March 2026 audit's file landed in August, and showing August there would
 * contradict its title. Within a month the order follows when each one landed.
 */
export const AUDITS: readonly {
  title: string;
  href: string;
  /** The month the document itself carries, from its own name or the release it covers. */
  date: { text: string; iso: string };
  summary: string;
}[] = [
  {
    title: "March 2026 security audit",
    href: `${DOCS_URL}audits/2026-03-security-audit/`,
    date: { text: "March 2026", iso: "2026-03" },
    summary:
      "The flaws found in the previous repository's client code, which of them were used against the ETC Cooperative's bootnodes, and which releases carry each one.",
  },
  {
    title: "Security follow-up",
    href: `${DOCS_URL}audits/2026-08-security-followup/`,
    date: { text: "August 2026", iso: "2026-08" },
    summary: "What remained after the first round of fixes, and how each item was closed.",
  },
  {
    title: "Dependency modernization",
    href: `${DOCS_URL}audits/2026-08-dependency-modernization/`,
    date: { text: "August 2026", iso: "2026-08" },
    summary:
      "What the dependency tree held before the modernization, what moved, and what the build does differently afterwards.",
  },
  {
    title: "Release pipeline audit",
    href: `${DOCS_URL}audits/2026-09-release-pipeline/`,
    date: { text: "September 2026", iso: "2026-09" },
    summary:
      "What the published archives actually contain: platform floors, architectures and provenance, measured from the files themselves.",
  },
  {
    title: "Release report",
    href: `${DOCS_URL}release-reports/v1.13.0/`,
    date: { text: "September 2026", iso: "2026-09" },
    summary:
      "What the release fixes, what it changes, how to verify a download, and what is known to be imperfect in it.",
  },
  {
    title: "Go toolchain audit",
    href: `${DOCS_URL}audits/2026-09-go-toolchain/`,
    date: { text: "September 2026", iso: "2026-09" },
    summary:
      "What a binary inherits from the Go version it was built with, measured per release, and why a release left unbuilt keeps its toolchain's advisories for as long as it runs.",
  },
  {
    title: "The record behind the release",
    href: `${DOCS_URL}release-reports/v1.13.0-record/`,
    date: { text: "September 2026", iso: "2026-09" },
    summary:
      "Every claim made about the release answered from the public record: commit metadata, pull requests, release files and advisory databases.",
  },
];

/** The pages the brand in the header opens, in the order a reader meets them. */
export const BRAND_MENU: readonly { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Downloads", href: "/downloads/" },
  { label: "Security", href: "/security/" },
  { label: "About", href: "/about/" },
  { label: "Sponsor", href: "/sponsor/" },
];

/**
 * The footer's routes, in the order a reader needs them: what to read, where the work is,
 * and how to reach the people doing it. The documentation's own footer is the model, which
 * carries the license, then support, then security. No address is published here beyond the
 * security one, which is the address the policy names.
 */
export const FOOTER_GROUPS: readonly {
  heading: string;
  links: readonly { label: string; href: string }[];
}[] = [
  {
    heading: "Read",
    links: [
      { label: "Documentation", href: DOCS.home.href },
      { label: "Install a node", href: DOCS.installation.href },
      { label: "For node operators", href: DOCS.operators.href },
      { label: "Questions and answers", href: DOCS.faq.href },
    ],
  },
  {
    heading: "The project",
    links: [
      { label: "Downloads", href: "/downloads/" },
      { label: "Security", href: "/security/" },
      { label: "About", href: "/about/" },
      { label: REPO.slug, href: REPO.url },
    ],
  },
  {
    heading: "Reach the maintainers",
    links: [
      { label: "Discord", href: DISCORD_URL },
      { label: "Issues", href: ISSUES_URL },
      { label: "Security policy", href: SECURITY_POLICY_URL },
      { label: "Sponsor this work", href: "/sponsor/" },
    ],
  },
];

/**
 * The support band, written as one argument and edited as one: no treasury pays for this
 * client, three organizations have, the one paying now is a stopgap, and the operations
 * that depend on the chain are who the work is for. Sourced from the client's support
 * page and project history, and from the discovery lists' README and support page, which
 * publish the Cooperative's wind-down and the DAO's part. Patch a sentence here only by
 * re-reading the band: the parts are parallel on purpose.
 */
export const SUPPORT = {
  statement: "Ethereum Classic has no long-term funding solution.",
  body: "No part of the network's fee or issuance revenue pays for this client. Whether it is maintained has always depended on an organization choosing to pay for it, and every organization that has done so eventually left, handing the work to the next one.",
  close:
    "A funder of last resort keeps the work alive. It does not make the work sustainable, and it leaves the network one backer away from the gap it has just come out of. The developers who maintain the client are in place and so is the entity behind them, and what the work needs is steady funding from the operations that depend on it: mining pools, exchanges and custodians, issuers of Ethereum Classic products, mining hardware manufacturers, block explorers and RPC providers.",
  cta: { label: "Sponsor this work", href: "/sponsor/" },
} as const;

/**
 * The three funders, in order, each saying who paid, what they paid for and how it ended.
 * The funders and their years are the table on the discovery lists' support page and the
 * organizations table in the project history; the Cooperative's maintenance mode and its
 * dissolution are the lists' README; the 21 months and February 2026 are the project
 * history. Keep the three parallel in length: this is an argument, not three paragraphs.
 */
export const STEWARDSHIP: readonly {
  date: string;
  heading: string;
  /** The block range it funded across, from ECIP-1066. Blocks alone: the caption under
   *  the strip says what they are, and the upgrade names made the line too long to scan. */
  span: string;
  body: string;
  link: { label: string; href: string };
}[] = [
  {
    date: "2016",
    heading: "ETCDEV",
    span: "2,500,000 to 5,900,000",
    body: "Maintained Ethereum Classic's first clients, Classic Geth among them, in the legacy `ethereumproject` GitHub organization, from the Gas Reprice upgrade in October 2016 to Defuse Difficulty Bomb in May 2018. Left the ecosystem in 2018.",
    link: { label: "ETC's first clients", href: "https://github.com/ethereumproject" },
  },
  {
    date: "2019",
    heading: "ETC Labs",
    span: "8,772,000 to 13,189,133",
    body: "Funded client development from the Atlantis upgrade in 2019 to Magneto in 2021, including the work that forked multi-geth into Core-Geth and led it through the rebrand. Left the ecosystem in 2021.",
    link: {
      label: "The fork and the rebrand",
      href: "https://medium.com/etc-core/core-geth-a-distribution-of-go-ethereum-with-many-flavors-a80fc29ca17a",
    },
  },
  {
    date: "2022",
    heading: "ETC Cooperative",
    span: "14,525,000 to 19,250,000",
    body: "Funded Core-Geth from January 2022, through the Mystique and Spiral upgrades, then [entered maintenance mode](https://etccooperative.org/etc-cooperative-retrospective-2024.pdf) at the end of 2024. Core development stalled from June 2024 to February 2026, and the Cooperative is scheduled to dissolve by the end of 2026.",
    link: { label: "Where each service continues", href: DOCS.transition.href },
  },
  {
    date: "2025",
    heading: "Ethereum Classic DAO",
    span: "19,250,000 to present",
    body: "Funded the resumption of maintenance in February 2026. An attack on the ETC Cooperative's bootnodes that March used two of the flaws the gap had left unpatched, and `v1.13.0` shipped in September 2026 with every one of them closed. The work itself is done by the core developers and the community.",
    link: { label: "ethereumclassicdao.org", href: "https://ethereumclassicdao.org" },
  },
];

/** Where the activation blocks above come from, cited once under the strip. */
export const UPGRADE_REGISTRY = {
  label: "ECIP-1066",
  href: "https://ecips.ethereumclassic.org/ECIPs/ecip-1066",
};
