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

/** The line under the name in the hero. */
export const TAGLINE = "The Ethereum Classic execution client";

/** The home page's title. Other pages use "<page> - Core-Geth", as the documentation does. */
export const HOME_TITLE = "Core-Geth: the Ethereum Classic execution client";

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
  "Core-Geth is the Ethereum Classic execution client, a go-ethereum downstream. Run an ETC or Mordor node, and find its releases, guides and security audits.";

/** Alt text for the social card, the same words the documentation uses for it. */
export const SOCIAL_CARD = {
  path: "/social-card.png",
  width: 1200,
  height: 630,
  alt: "Core-Geth, the Ethereum Classic execution client",
} as const;

export const REPO = {
  slug: "ethereumclassic/core-geth",
  url: "https://github.com/ethereumclassic/core-geth",
  releasesUrl: "https://github.com/ethereumclassic/core-geth/releases",
  /** GitHub's address for the newest release: a link to it lands on a release the moment
   *  it ships, where a tag link would keep pointing at the old one. */
  latestUrl: "https://github.com/ethereumclassic/core-geth/releases/latest",
} as const;

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
    "Before you move a node, a pool or an application to a new source of software or data, confirm which organization publishes it.",
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
 * The four actions the operators page opens with ("Do these four things"). Each
 * links there, and the reasons are left to that page, except the MESS setting: it
 * links the MESS page's trade per operator type and states only what the operators
 * page states, in the maintainer's wording. `code` is set in monospace after `text`;
 * `detail` is a line beneath it, with backticks marking code.
 */
export const OPERATOR_ACTIONS: readonly {
  text: string;
  code?: string;
  detail?: string;
  href?: string;
}[] = [
  { text: "Upgrade to the current release" },
  { text: "Rotate the P2P node key" },
  { text: "Track releases at ", code: REPO.slug },
  {
    text: "Decide the MESS setting",
    detail:
      "`v1.13.0` ships MESS on. It decides which of two competing chains a node prefers during a deep reorganization, and never whether a block is valid. Every node in one fleet should carry the same setting.",
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
  state: string;
}[] = [
  {
    running: "`v1.12.20` and older",
    nodes: 158,
    status: "exposed",
    state: "all six client CVEs open",
  },
  {
    running: "`v1.12.21`",
    nodes: 50,
    status: "exposed",
    state: "two CVEs closed, four open, Go 1.21",
  },
  {
    running: "`v1.12.22`",
    nodes: 165,
    status: "exposed",
    state: "CVEs backported, one only partly, plus a sync regression",
  },
  {
    running: "`v1.12.23`",
    nodes: 138,
    status: "exposed",
    state: "55 to 61 Go advisories, no GraphQL limit, regression unfixed",
  },
  {
    running: "`v1.12.24`",
    nodes: 4,
    status: "exposed",
    state: "an unreleased development build, not a release",
  },
  {
    running: "`v1.13.0`",
    nodes: 9,
    status: "recommended",
    state: "recommended client, zero Go advisories",
  },
];

const networkTotal = NETWORK_ROWS.reduce((sum, row) => sum + row.nodes, 0);
const networkShare = (nodes: number) => (nodes / networkTotal) * 100;
const recommendedRows = NETWORK_ROWS.filter((row) => row.status === "recommended");
const [recommended] = recommendedRows;
if (!recommended || recommendedRows.length !== 1) {
  throw new Error("NETWORK_RUNNING needs exactly one recommended release");
}
// "v1.13.0" from the row, and its line, "v1.13.x".
const recommendedRelease = recommended.running.replaceAll("`", "");
const recommendedLine = recommendedRelease.replace(/\.\d+$/, ".x");

export const NETWORK_RUNNING = {
  measured: { iso: "2026-09-17", text: "17 September 2026" },
  source: { label: "etcnodes.org", href: "https://etcnodes.org" },
  evidence: `${DOCS_URL}release-reports/v1.13.0-record/#what-the-network-is-running`,
  upgrade: { label: "Upgrade to the latest release", href: REPO.latestUrl },
  total: networkTotal,
  /** The line above the table: what the recommended release resolves, in the record's
   *  words for its row, and the maintainer's recommendation to run it beside the current
   *  nodes before moving a whole fleet to its line. The trial node takes no traffic: the
   *  migration guide asks for one MESS setting per fleet, and `v1.12.x` runs MESS off where
   *  `v1.13.0` turns it on. Check all of it against the documentation whenever the
   *  recommended release changes. */
  lede: `\`${recommendedRelease}\` resolves all six client CVEs, fixes the GraphQL limit and carries zero Go standard library advisories. Run a \`${recommendedRelease}\` node beside your current ones without sending it traffic, and when you are comfortable, move your whole fleet to the \`${recommendedLine}\` line.`,
  rows: NETWORK_ROWS.map((row) => ({ ...row, share: `${networkShare(row.nodes).toFixed(1)}%` })),
} as const;

/**
 * What Core-Geth is. The definition and the upstream line are the documentation
 * home's; `oneNode` is "What this runs" in Run an Ethereum Classic node. The
 * definition is also the JSON-LD description. Backticks mark code.
 */
export const ABOUT = {
  definition:
    "Core-Geth is a go-ethereum downstream that holds chain configuration as data, so one binary serves Ethereum Classic, the Mordor test network, MintMe and private chains.",
  upstream:
    "Upstream go-ethereum has removed support for Ethereum Classic, whose consensus rules are maintained here.",
  oneNode:
    "`geth` is the whole node. Ethereum Classic is proof of work, so there is no consensus client or beacon node to run beside it.",
} as const;

/** Where releases do not come from, as the documentation home states it. */
export const PREVIOUS_NAMESPACE =
  "Archives published under the previous `etclabscore` namespace are not built from this source and do not carry the fixes released here.";

/**
 * The three records the security section opens, in the maintainer's framing
 * (2026-09-18): the attack and the dormancy were `etclabscore/core-geth`'s, and
 * `ethereumclassic/core-geth` is the solution. Each summary is its page's own
 * account: the audit of `etclabscore/core-geth` and its "March 2026 attack on
 * Ethereum Classic bootnodes"; the toolchain audit, "a binary keeps its toolchain's
 * advisories for as long as it runs"; and the release that resolves every finding in
 * both. Backticks mark code.
 */
export const RECORDS: readonly { label: string; summary: string; page: DocPage }[] = [
  {
    label: "The attack",
    summary: `The flaws the audit found in \`${PREVIOUS_REPO}\`, what was exploited against Ethereum Classic bootnodes in March 2026, and which releases carry each one.`,
    page: DOCS.securityAudit,
  },
  {
    label: "The dormancy",
    summary: `Left unmaintained, \`${PREVIOUS_REPO}\` kept shipping on Go versions that are no longer supported, and a binary keeps its toolchain's advisories for as long as it runs.`,
    page: DOCS.goToolchain,
  },
  {
    label: "The solution",
    summary: `The release from \`${REPO.slug}\` that resolves both: what it fixes, what it changes, and how to verify a download.`,
    page: DOCS.releaseReport,
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

export const SECURITY_EMAIL = "security@ethereumclassic.com";
export const DISCORD_URL = "https://ethereumclassic.com/discord";
export const ISSUES_URL = `${REPO.url}/issues`;
export const ADVISORIES_URL = `${REPO.url}/security/advisories`;

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
    body: "Privately, never in a public issue or channel. A person answers it: one of the core developers who maintain this client.",
    links: [
      { label: SECURITY_EMAIL, href: `mailto:${SECURITY_EMAIL}` },
      { label: "Private advisories", href: ADVISORIES_URL },
    ],
  },
];

/** Why the maintenance needs funding, as "Who depends on it" on the support page states it. */
export const SUPPORT = {
  statement: "Ethereum Classic has no protocol treasury.",
  body: "Core-Geth is maintained as a public good, and no part of the network's fee or issuance revenue funds that maintenance. If the client is maintained, someone with a stake in the chain pays for it.",
} as const;
