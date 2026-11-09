/**
 * What this site writes above each mirrored audit and release report: a summary of the whole
 * document, the figures it leads with, and the description search results and link previews show.
 *
 * The report itself is the documentation's, re-synced from `ethereumclassic/core-geth`, so it is
 * never edited here. Everything in this module is this site's own reading of it, and each claim
 * must already be in the report it sits above: written from the report read in full, never from
 * memory or from another page. The site names no contractor, as everywhere else.
 *
 * Every figure names the passage it comes from in `evidence`, and the build fails if that passage
 * is not in the report word for word, so a re-sync that changes a number cannot leave a stale
 * figure standing above it. Backticks mark code, and `[label](href)` a link, as in `site.ts`.
 */
import type { Stat } from "@/components/StatStrip.astro";
import { EXPOSED_LINE, RECOMMENDED_LINE } from "@/data/site";

export interface ReportFigure extends Stat {
  /** A passage of the report, word for word, that the figure is read from. */
  evidence: string;
}

export interface ReportPage {
  /** The meta description and the hero's lede: what the document found, and the move it
   *  supports. Between 110 and 160 characters, the budget `acceptance.py` holds. */
  description: string;
  /** The summary above the report, in paragraphs: what was examined, what was found, what
   *  fixed it, and what an operator does now. */
  summary: readonly string[];
  figures: readonly ReportFigure[];
}

export const REPORTS: Readonly<Record<string, ReportPage>> = {
  "2026-03-core-geth-v1.12-security-audit": {
    description: `Six CVEs and a GraphQL denial of service in Core-Geth ${EXPOSED_LINE}, one used to crash its bootnodes. Move to the ${RECOMMENDED_LINE} line, which fixes every finding.`,
    summary: [
      `This audit examined \`etclabscore/core-geth\` at \`${EXPOSED_LINE}.20\`, the last substantive release of the \`${EXPOSED_LINE}\` line, published June 10, 2024. The line then went 21 months without security maintenance, and the audit found six client CVEs and a GraphQL query-depth denial of service unpatched in it, spanning cryptographic key validation, P2P protocol memory exhaustion and query processing.`,
      `On March 18, 2026 one of them, CVE-2026-22862, a crash in the ECIES handshake, was used to crash-loop Core-Geth \`${EXPOSED_LINE}\` bootnodes. The releases that followed in \`etclabscore/core-geth\`, \`${EXPOSED_LINE}.21\` through \`${EXPOSED_LINE}.23\`, closed some of the findings, left others open and added two regressions, \`eth_syncing\` in \`${EXPOSED_LINE}.22\` and a snap storage-range cap in \`${EXPOSED_LINE}.23\`, so no \`${EXPOSED_LINE}\` release closes every finding. \`${EXPOSED_LINE}.21\` and \`${EXPOSED_LINE}.22\` were cut from the security work Ethereum Classic core developers had reported privately.`,
      // What an end-of-life toolchain means for a node, in the Go toolchain audit's terms:
      // the standard library is compiled into the binary, the client serves the network with
      // it, and its fixes never reach a binary built before them.
      `Every release from \`${EXPOSED_LINE}.20\` to \`${EXPOSED_LINE}.23\` is also built with Go 1.21 and Go 1.22, which the Go team stopped supporting in August 2024 and February 2025. Go compiles its standard library into the binary, including code a node exposes to the network: the HTTP servers behind its JSON-RPC, WebSocket and GraphQL endpoints, its TLS and certificate handling, and the DNS lookups for its peer discovery lists. A flaw the Go team has fixed since then stays in a \`${EXPOSED_LINE}\` binary for as long as it runs. The [Go toolchain audit](/security/2026-09-core-geth-v1.12-go-toolchain-audit/) counts 62 such flaws across these releases, 48 of them in code compiled into the binary. Many are denial-of-service flaws that need no authentication; whether a node can be made to reach each one was not assessed.`,
      `\`${RECOMMENDED_LINE}.0\`, released from \`ethereumclassic/core-geth\` on September 14, 2026, patches all six client CVEs and the GraphQL denial of service with test coverage, moves the build to the supported Go 1.26 toolchain, and carries neither \`${EXPOSED_LINE}\` regression. Nothing in this audit is left open in \`${RECOMMENDED_LINE}.0\`. Ethereum Classic core developers recommend Core-Geth operators migrate to the latest release on the \`${RECOMMENDED_LINE}\` line for continued development support.`,
    ],
    figures: [
      {
        label: "Without security maintenance",
        value: "21 months",
        caption: `In \`etclabscore/core-geth\` after \`${EXPOSED_LINE}.20\`, June 10, 2024.`,
        tone: "exposed",
        evidence: "a 21-month gap",
      },
      {
        label: "Findings left unpatched",
        value: "7",
        caption: "Six client CVEs and a GraphQL query-depth denial of service.",
        tone: "exposed",
        evidence: "Six CVEs and one GraphQL depth-limit DoS were found unpatched",
      },
      {
        label: "Bootnode restarts",
        value: "805+",
        caption:
          "One bootnode's crash-loop count when the first emergency release shipped, March 18, 2026.",
        tone: "exposed",
        evidence: "805+ restart cycles",
      },
      {
        label: `Left open in ${RECOMMENDED_LINE}.0`,
        value: "0",
        caption: "Every finding patched with test coverage, on the supported Go 1.26.",
        tone: "recommended",
        evidence: "Nothing in this document is left open.",
      },
    ],
  },
  "2026-08-core-geth-v1.12-security-follow-up": {
    description: `Core-Geth ${EXPOSED_LINE}.23 still ships an open CVE, unbounded GraphQL queries, two regressions and end-of-life Go. Move to the ${RECOMMENDED_LINE} line, which fixes every finding.`,
    summary: [
      `\`${EXPOSED_LINE}.23\` Argos, released on August 14, 2026, is the third release \`etclabscore/core-geth\` has cut since the March 2026 audit, and real security work: 32 commits carrying a delayed-decoding hardening series for the p2p protocols and seven go-ethereum backports. It completes the fix for CVE-2026-26313, peer message memory exhaustion, by decoding a peer's message only after the message has been validated.`,
      `It leaves the other \`${EXPOSED_LINE}\` findings in place. CVE-2026-22868 is still unpatched, GraphQL queries still nest without limit, and the \`eth_syncing\` regression from \`${EXPOSED_LINE}.22\` still reports the wrong network head to the exchanges, explorers and monitoring that read it to decide whether a node has synced. The Go toolchains are unchanged: Go 1.21 and, for the Arm archives, Go 1.22, 24 and 18 months past end of life, and its archives carry 62 Go standard library advisories that no \`${EXPOSED_LINE}\` binary will ever receive fixes for. It also adds a regression of its own, a cap on snap storage-range responses that can disconnect peers answering correctly, the class of error it corrects for account ranges.`,
      `Its release notes carry no advisory identifiers, and the \`${EXPOSED_LINE}.22\` notes attach CVE-2026-26315 to work the advisory records assign to CVE-2026-26314, so an operator matching advisories against release notes can conclude a shipped fix is missing. None of the three emergency releases asks operators to rotate the P2P node key, so a node patched without rotating still runs a key exposed under \`${EXPOSED_LINE}.20\`.`,
      `\`${RECOMMENDED_LINE}.0\`, released from \`ethereumclassic/core-geth\` on September 14, 2026, carries every fix, the same p2p hardening series, the Go 1.26 toolchain and no snap item cap, so every finding in this follow-up and in the March audit is resolved. Ethereum Classic core developers recommend Core-Geth operators migrate to the latest release on the \`${RECOMMENDED_LINE}\` line for continued development support.`,
    ],
    figures: [
      {
        label: `Commits in ${EXPOSED_LINE}.23`,
        value: "32",
        caption:
          "A delayed-decoding hardening series for the p2p protocols, and seven go-ethereum backports.",
        evidence: "32 commits carrying a delayed-decoding hardening series",
      },
      {
        label: "Go 1.21 past end of life",
        value: "24 months",
        caption:
          "It built the Linux, macOS and Windows archives; Go 1.22, 18 months past, built the Arm ones.",
        tone: "exposed",
        evidence: "Go 1.21, now 24 months past",
      },
      {
        label: "Storage-range reply cap",
        value: "10,240",
        caption: `Storage slots per reply before a \`${EXPOSED_LINE}.23\` node disconnects the peer; an honest reply can hold about 15,900.`,
        tone: "exposed",
        evidence: "against a cap of **10,240**",
      },
      {
        label: `Left open in ${RECOMMENDED_LINE}.0`,
        value: "0",
        caption: `Every finding here and in the March audit is resolved in \`${RECOMMENDED_LINE}.0\`.`,
        tone: "recommended",
        evidence: "Every finding in this document and in the",
      },
    ],
  },
  "2026-08-core-geth-v1.12-dependency-modernization": {
    description: `Core-Geth ${EXPOSED_LINE} ran unsupported Go on a module graph unmoved since 2024. Move to the ${RECOMMENDED_LINE} line, built on Go 1.26 with 83 module changes.`,
    summary: [
      `This report records what changed underneath Core-Geth between its December 2024 archive point, commit \`7ef3ecd7a\`, and \`${RECOMMENDED_LINE}.0\`. The archived \`${EXPOSED_LINE}\` line was pinned to Go 1.21 in \`go.mod\` and CI and to Go 1.22 for its download path and Docker builder, versions that left support in August 2024 and February 2025, so every artifact built from that line runs a standard library that no longer receives security fixes. Its module graph had not moved since December 2024. Neither condition announces itself: an end-of-life toolchain still compiles and passes tests with no warning.`,
      `\`${RECOMMENDED_LINE}.0\` builds on Go 1.26.8, and the three Go versions the archived line ran now agree. Behind it are 83 module changes, 17 modules removed and 16 added, and no addition is a direct dependency. Four modules that carry consensus weight, \`gnark-crypto\`, \`go-kzg-4844\`, \`blst\` and \`uint256\`, were each read before being taken and checked against the consensus test suites, and \`fjl/memsize\` was removed because Go 1.23 restricted the runtime internals it reached into. Both networks were synchronized from genesis on the resulting build.`,
      `Some pins stayed on purpose, and the report says why: the AWS SDK v2 modules match go-ethereum's own pins and are reachable only from the \`cmd/devp2p\` publishing tool, \`c-kzg-4844\` stays at v0.4.0 with no advisory against it, and the vendored C \`libsecp256k1\` is tracked as outstanding work. The linter moved last, from golangci-lint 1.55.2, which could not parse Go 1.26 and so reported clean by failing, to 2.13.1, and \`make lint\` reports zero issues on the resulting tree.`,
      `Every \`${EXPOSED_LINE}\` artifact still runs the unsupported standard library and the December 2024 module graph. Ethereum Classic core developers recommend Core-Geth operators migrate to the latest release on the \`${RECOMMENDED_LINE}\` line for continued development support.`,
    ],
    figures: [
      {
        label: "Module changes",
        value: "83",
        caption: "17 modules removed and 16 added, measured against the December 2024 baseline.",
        evidence: "**83 modules changed, 17 removed, 16 added.**",
      },
      {
        label: "Direct dependencies added",
        value: "0",
        caption:
          "All 16 additions are indirect: a currency and security pass, not a change in what the client depends on.",
        tone: "recommended",
        evidence: "No direct dependency was added.",
      },
      {
        label: "Go toolchain",
        value: "1.26.8",
        caption:
          "In support, replacing Go 1.21 and Go 1.22, which left support in August 2024 and February 2025.",
        tone: "recommended",
        evidence: "`v1.13.0` builds on Go 1.26.8",
      },
      {
        label: "Consensus-weight modules",
        value: "4",
        caption:
          "`gnark-crypto`, `go-kzg-4844`, `blst` and `uint256`, each read before it was taken and checked against the consensus test suites.",
        evidence: "Four of these carry consensus weight",
      },
    ],
  },
  "2026-09-core-geth-v1.12-release-pipeline": {
    description: `Core-Geth ${EXPOSED_LINE}.21 to ${EXPOSED_LINE}.23 need glibc 2.34, the osx archives hold an Apple Silicon binary, and none is attested. Move to the ${RECOMMENDED_LINE} line.`,
    summary: [
      `This audit measured the published \`${EXPOSED_LINE}.20\` to \`${EXPOSED_LINE}.23\` release archives by downloading and opening them, rather than by reading the configuration that built them. The defects it found are invisible in the source, the build log and the release notes: the build succeeds, the tests pass and the checksum matches.`,
      `From \`${EXPOSED_LINE}.21\`, every Linux archive requires glibc 2.34, up from 2.17 in \`${EXPOSED_LINE}.20\` on x86_64, so Ubuntu 20.04, Debian 11, RHEL 8 and Amazon Linux 2 cannot run any later \`${EXPOSED_LINE}\` release, and nothing in a build log reported the change. From \`${EXPOSED_LINE}.20\`, the \`osx\` archive holds an Apple Silicon binary under a name that does not say so, which an Intel Mac cannot run. The \`${EXPOSED_LINE}\` line no longer builds against a C23 compiler, because the \`blst\` v0.3.11 header it carries defines \`bool\` itself. Every \`${EXPOSED_LINE}\` release was published from \`etclabscore/core-geth\` with no signature and no build attestation, so the link between an archive and the commit it claims to come from rests on the publisher's word.`,
      `\`${RECOMMENDED_LINE}.0\` states its platform floor as a build input and fails the release if an archive misses it: glibc 2.17 on x86_64 and the \`${EXPOSED_LINE}.20\` floors on Arm, and macOS 12 for both Mac architectures, each published under its own name. It carries \`blst\` v0.3.17, and every archive and image ships with a checksum and a build attestation recording which workflow, at which commit, produced it. Ethereum Classic core developers recommend Core-Geth operators migrate to the latest release on the \`${RECOMMENDED_LINE}\` line for continued development support.`,
    ],
    figures: [
      {
        label: `Linux floor from ${EXPOSED_LINE}.21`,
        value: "glibc 2.34",
        caption: `Up from 2.17 in \`${EXPOSED_LINE}.20\`, which shuts out Ubuntu 20.04, Debian 11, RHEL 8 and Amazon Linux 2.`,
        tone: "exposed",
        evidence: "**GLIBC_2.34**",
      },
      {
        label: "osx archives for Intel Macs",
        value: "0 of 4",
        caption: `From \`${EXPOSED_LINE}.20\` to \`${EXPOSED_LINE}.23\`, each holds an Apple Silicon binary under a name that does not say so.`,
        tone: "exposed",
        evidence: "none of the four `osx` archives measured here is for your machine",
      },
      {
        label: `Attested ${EXPOSED_LINE} archives`,
        value: "0",
        caption:
          "A checksum shows a download arrived intact, never who built it, and that line publishes no signature either.",
        tone: "exposed",
        evidence: "That line publishes no signature and no build attestation",
      },
      {
        label: `${RECOMMENDED_LINE}.0 Linux floor`,
        value: "glibc 2.17",
        caption: "On x86_64, held by a release that fails if an archive misses it.",
        tone: "recommended",
        evidence: "**`v1.13.0` requires GLIBC_2.17 on x86_64**",
      },
    ],
  },
  "2026-09-core-geth-v1.12-go-toolchain-audit": {
    description: `Core-Geth ${EXPOSED_LINE}.20 to ${EXPOSED_LINE}.23 carry 62 Go standard library advisories from out-of-support Go. Move to the ${RECOMMENDED_LINE} line, built on Go 1.26.`,
    summary: [
      `Go compiles its standard library into every binary, \`crypto/tls\` and \`net/http\` included, so a Go security fix reaches a node only through a client release built with it, and a binary keeps its toolchain's advisories for as long as it runs. This audit read the toolchain that built every published archive of \`${EXPOSED_LINE}.20\` to \`${EXPOSED_LINE}.23\` and \`${RECOMMENDED_LINE}.0\` from the binaries themselves.`,
      `Each release from \`${EXPOSED_LINE}.20\` to \`${EXPOSED_LINE}.23\` was built by two toolchains, Go 1.21 and Go 1.22, both out of support before the 2026 releases shipped, and 21 of their 32 archives, every Arm archive among them, by go1.22.1. Across its archives each release carries 62 Go standard library advisories, 48 of them with the vulnerable code present in the binary, the largest groups in the \`net/http\` servers behind the JSON-RPC, WebSocket and GraphQL endpoints and in \`crypto/x509\` and \`crypto/tls\`. Both majors left support in 2024 and 2025, so that count only rises and none of the fixes will ever reach those binaries. Whether a node can be made to reach each one was not assessed.`,
      `Rebuilding a \`${EXPOSED_LINE}\` release on a supported Go does not clear the problem either. At the \`${EXPOSED_LINE}.23\` release commit the build stops at \`blst\` v0.3.11, which Go 1.24 rejects, and at \`fjl/memsize\`, which Go 1.23 will not link, and a rebuild that clears both still declares \`go 1.21\`, which switches off two denial-of-service limits newer Go added. The third-party modules moved as well: 44 of the 47 module advisories matched in \`${EXPOSED_LINE}.23\` are absent from \`${RECOMMENDED_LINE}.0\`.`,
      `Every \`${RECOMMENDED_LINE}.0\` archive and image is built with go1.26.8, the newest Go 1.26 release when it was cut, declares \`go 1.26\`, and carried no Go standard library advisory when this audit was run. Go 1.26 is supported until go1.28.0 is released, and a Go security release reaches a node only through a Core-Geth release built with it. Ethereum Classic core developers recommend Core-Geth operators migrate to the latest release on the \`${RECOMMENDED_LINE}\` line for continued development support.`,
    ],
    figures: [
      {
        label: "Go standard library advisories",
        value: "62",
        caption: `Across the archives of each release from \`${EXPOSED_LINE}.20\` to \`${EXPOSED_LINE}.23\`, and the count only rises.`,
        tone: "exposed",
        evidence:
          "Across all its archives each of those releases carries 62 Go standard library advisories",
      },
      {
        label: "With the flawed code in the binary",
        value: "48",
        caption:
          "Present at symbol level; whether a node can be made to reach each one was not assessed.",
        tone: "exposed",
        evidence: "48 of them with the vulnerable code present in the binary",
      },
      {
        label: `Go majors behind the ${EXPOSED_LINE} line`,
        value: "8",
        caption: `From Go 1.13 to Go 1.22, across the 50 \`${EXPOSED_LINE}\` archives measured, and none is supported today.`,
        tone: "exposed",
        evidence:
          "were built with eight Go majors, from Go 1.13 to Go 1.22, and none of them is supported today",
      },
      {
        label: `In ${RECOMMENDED_LINE}.0`,
        value: "0",
        caption: "Go standard library advisories against go1.26.8 when this audit was run.",
        tone: "recommended",
        evidence: "**Standard library: nothing.**",
      },
    ],
  },
  "2026-09-core-geth-v1.13.0-release-report": {
    description: `Core-Geth ${RECOMMENDED_LINE}.0 fixes six CVEs and a GraphQL denial of service in the ${EXPOSED_LINE} line, built on supported Go with attested files. Move to the ${RECOMMENDED_LINE} line.`,
    summary: [
      `\`${RECOMMENDED_LINE}.0\`, released from \`ethereumclassic/core-geth\` on September 14, 2026, is the stable, recommended Core-Geth release, and the \`${RECOMMENDED_LINE}\` line is where the client is maintained going forward. It shipped with about six months of testing on Ethereum Classic mainnet and Mordor behind it and no critical issue found. This report keeps the detail its release notes summarize: every change an operator can observe, the files it publishes, and the complete list of known issues.`,
      `Every \`${EXPOSED_LINE}.x\` release ships known-vulnerable code, and one of those flaws was exploited against the Core-Geth \`${EXPOSED_LINE}\` bootnodes in March 2026. \`${RECOMMENDED_LINE}.0\` fixes six CVEs and a GraphQL denial of service: a crash any peer can trigger during the RLPx handshake, repeated handshakes that leak bits of the node's own P2P key, a secp256k1 coordinate field boundary bypass, an off-curve public key accepted by \`UnmarshalPubkey\`, one crafted p2p message that exhausts the node's memory, a KZG proof verification denial of service, and GraphQL queries that nest without limit. The [March audit](/security/2026-03-core-geth-v1.12-security-audit/) and the [August follow-up](/security/2026-08-core-geth-v1.12-security-follow-up/) show which \`${EXPOSED_LINE}.x\` releases carry which issue. Every \`${RECOMMENDED_LINE}.0\` binary and image is built with Go 1.26.8, a supported toolchain, where the \`${EXPOSED_LINE}\` line from \`${EXPOSED_LINE}.20\` on was built with Go 1.21 and Go 1.22. When \`${RECOMMENDED_LINE}.0\` shipped, govulncheck reported no Go standard library advisory for any of its node archives or image tarballs.`,
      `Upgrading from a \`${EXPOSED_LINE}\` release means rotating the node's P2P key, because CVE-2026-26315 leaks bits of it. A few defaults change. With no network flag, a \`${RECOMMENDED_LINE}.0\` node runs Ethereum Classic mainnet, and \`--mainnet\` now means \`--classic\`; in \`${EXPOSED_LINE}.x\`, both started an Ethereum mainnet node. The node finds peers only through the discovery lists published from \`ethereumclassic/discv4-dns-lists\`, because the two older lists are signed by a key the project does not hold, and it starts the Engine API only on a chain configured for the merge. If you run a private network, check its genesis or chainspec file before you upgrade: \`${RECOMMENDED_LINE}.0\` reads a fork block number of 2^63 or more, a negative one, or such a number in the difficulty bomb delay schedule the way go-ethereum does.`,
      `\`${RECOMMENDED_LINE}.0\` ships with MESS (ECBP-1100) on by default, on Ethereum Classic and Mordor, because every \`${EXPOSED_LINE}\` node on the network carried severe vulnerabilities when it was released. MESS defends a node against deep chain reorganizations, a security-first default while \`${EXPOSED_LINE}\` nodes remain exposed. \`${RECOMMENDED_LINE}.1\` turns MESS off by default again, once the move to the \`${RECOMMENDED_LINE}\` line is expected to be under way, or at least the \`${EXPOSED_LINE}\` vulnerabilities are widely known. To choose for yourself on \`${RECOMMENDED_LINE}.0\`, start the node with \`--mess\` or \`--mess=false\`.`,
      `The release publishes 18 archives, a node archive and a \`core-geth-alltools\` archive with the developer tools for each of nine builds, and container images for \`linux/amd64\` and \`linux/arm64\`. Every archive and image tarball comes with a checksum and a build attestation, and [coregeth.com/downloads](/downloads/) shows how to verify a file against its checksum and its attestation. A vulnerability scanner will flag go-ethereum advisories that are already fixed in these binaries, because the Go module path is deliberately \`github.com/ethereum/go-ethereum\`; each match was confirmed against the fix in the \`${RECOMMENDED_LINE}.0\` source. Ethereum Classic core developers recommend Core-Geth operators migrate to the latest release on the \`${RECOMMENDED_LINE}\` line for continued development support.`,
    ],
    figures: [
      {
        label: "Client CVEs fixed",
        value: "6",
        caption: `With a GraphQL denial of service; one of the issues was exploited against the \`${EXPOSED_LINE}\` bootnodes in March 2026.`,
        tone: "recommended",
        evidence: "It fixes six CVEs and a GraphQL denial of service",
      },
      {
        label: "Go toolchain",
        value: "1.26.8",
        caption: `Supported, for every binary and image; the \`${EXPOSED_LINE}\` line from \`${EXPOSED_LINE}.20\` on was built with Go 1.21 and Go 1.22.`,
        tone: "recommended",
        evidence: "Every binary and image is built with Go 1.26.8, a supported toolchain",
      },
      {
        label: "Release archives",
        value: "18",
        caption:
          "Nine node archives and their alltools counterparts, each with a checksum and a build attestation.",
        evidence: "so the release carries 18 archives",
      },
      {
        label: "Testing before release",
        value: "6 months",
        caption:
          "About six months on Ethereum Classic mainnet and Mordor, with no critical issue found.",
        tone: "recommended",
        evidence: "about six months of testing on Ethereum Classic mainnet and Mordor behind it",
      },
    ],
  },
  "2026-09-core-geth-v1.13.0-release-record": {
    description: `Claims about Core-Geth ${RECOMMENDED_LINE}.0, checked against commits, pull requests and release files: ${EXPOSED_LINE}.23 carries flaws ${RECOMMENDED_LINE}.0 fixes. Move to the ${RECOMMENDED_LINE} line.`,
    summary: [
      `This record sets \`${RECOMMENDED_LINE}.0\` against the claims made about it after it shipped. An article published on September 16, 2026 told node operators and mining pools not to run \`${RECOMMENDED_LINE}.0\`, to move any node already on it back to \`${EXPOSED_LINE}.23\`, and to restore a node key rotated as the \`${RECOMMENDED_LINE}.0\` migration guide instructs. The record answers each claim from commit metadata, pull requests, release files, advisory records and vulnerability databases, links every answer to the record it rests on, and says where the article is accurate.`,
      `The article's central claim, that nothing in \`${RECOMMENDED_LINE}.0\` fixes a vulnerability in \`${EXPOSED_LINE}.23\`, is contradicted by the release files. Every \`${EXPOSED_LINE}.23\` archive carries 55 to 61 Go standard library advisories, 43 to 47 of them with the vulnerable code present in the binary, and \`${RECOMMENDED_LINE}.0\`, built with go1.26.8, carries none of them. Scanners match 47 third-party module advisories against \`${EXPOSED_LINE}.23\`, and 44 of them are absent from \`${RECOMMENDED_LINE}.0\`. \`${RECOMMENDED_LINE}.0\` also patches CVE-2026-22868, limits GraphQL query depth and does not carry the snap response cap in \`${EXPOSED_LINE}.23\` that can disconnect peers answering correctly.`,
      `The security fixes were written in February and March 2026, reported privately in those months, and published as pull requests #10 to #36 on March 20 and 21, nearly six months before \`${RECOMMENDED_LINE}.0\` shipped on September 14. Of the 96 commits dated September 12 to 14 that the article counts, 41 are documentation, 31 are release engineering and 17 change the client, and the release went through seven release candidates. GitHub records no second reviewer's approval on any 2026 Core-Geth release in either repository: each 2026 \`etclabscore/core-geth\` release pull request was opened and merged by the same account, and the changes in \`${RECOMMENDED_LINE}.0\` were reviewed by automated agents against Ethereum client practice and port fixes merged upstream in go-ethereum.`,
      `Following the article's advice would leave a node less secure. Moving back to \`${EXPOSED_LINE}.23\` restores the Go standard library advisories \`${RECOMMENDED_LINE}.0\` removed, and restoring a rotated node key restores its exposure: the go-ethereum advisory for CVE-2026-26315 recommends rotating the key after the upgrade that fixes the leak. \`${RECOMMENDED_LINE}.0\` also moves peer discovery to lists published from \`ethereumclassic/discv4-dns-lists\`: the ETC Cooperative's trees that the \`${EXPOSED_LINE}\` line reads are signed by a key the project does not hold, and will stop being updated as the Cooperative dissolves. MESS changes which of two competing chains a node prefers, never whether a block is valid; \`${RECOMMENDED_LINE}.0\` ships it on because every \`${EXPOSED_LINE}\` node carried severe vulnerabilities when it was released, and \`${RECOMMENDED_LINE}.1\` ships it off again. Ethereum Classic core developers recommend Core-Geth operators migrate to the latest release on the \`${RECOMMENDED_LINE}\` line for continued development support.`,
    ],
    figures: [
      {
        label: `In each ${EXPOSED_LINE}.23 archive`,
        value: "55 to 61",
        caption: `Go standard library advisories, all published before \`${EXPOSED_LINE}.23\` shipped; \`${RECOMMENDED_LINE}.0\` carries none of them.`,
        tone: "exposed",
        evidence: "Each archive carries 55 to 61 standard library advisories",
      },
      {
        label: "Module advisories cleared",
        value: "44",
        caption: `Of the 47 that scanners match against the third-party modules in \`${EXPOSED_LINE}.23\`.`,
        tone: "recommended",
        evidence: "44 are absent from `v1.13.0`.",
      },
      {
        label: "Fixes public before release",
        value: "6 months",
        caption: "Nearly six months: pull requests #10 to #36 opened on March 20 and 21, 2026.",
        tone: "recommended",
        evidence:
          "`v1.13.0` shipped on September 14, nearly six months after the fixes were public.",
      },
      {
        label: "September client commits",
        value: "17",
        caption:
          "Of the 96 dated September 12 to 14 that the article counts; 41 are documentation and 31 release engineering.",
        evidence: "The remaining 17 change the client",
      },
    ],
  },
};

/** The step an operator takes, the same on every report page that has a summary. */
export const REPORT_ACTION = `If you run a \`${EXPOSED_LINE}\` node, move it to the \`${RECOMMENDED_LINE}\` line and rotate its P2P node key: CVE-2026-26315 is an oracle against that key, so a key used by an unpatched node should be treated as exposed.`;

// The guard: each figure's evidence must be in its report word for word. Whitespace is folded, so
// a passage the source wraps across lines still matches.
const raw = import.meta.glob<string>("../pages/security/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});
const fold = (s: string) => s.replace(/\s+/g, " ");
for (const [slug, page] of Object.entries(REPORTS)) {
  const source = raw[`../pages/security/${slug}.md`];
  if (source === undefined)
    throw new Error(`REPORTS names ${slug}, which is not a mirrored report`);
  for (const figure of page.figures) {
    if (!fold(source).includes(fold(figure.evidence))) {
      throw new Error(
        `${slug}: the figure "${figure.label}" cites "${figure.evidence}", which the report no longer says`,
      );
    }
  }
  if (page.description.length < 110 || page.description.length > 160) {
    throw new Error(
      `${slug}: the description is ${page.description.length} characters, outside 110 to 160`,
    );
  }
}
