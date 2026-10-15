import type { APIRoute } from "astro";
import {
  ABOUT,
  AUDITS,
  CONTACT,
  DOCS,
  type DocPage,
  EXPOSED_LINE,
  GUIDES,
  NETWORKS,
  NETWORK_RUNNING,
  OPERATOR_ACTIONS,
  PREVIOUS_NAMESPACE,
  RECOMMENDED_LINE,
  RECORDS,
  RELEASE_FIXES,
  RELEASE_TIMELINE,
  REPO,
  SITE_NAME,
  SITE_URL,
  SPONSOR,
  TRANSITION,
} from "@/data/site";

/**
 * Generates /llms.txt at build time, in the format docs.coregeth.com/llms.txt uses,
 * from the same data module the page renders, so the two cannot drift.
 *
 * Shorter than the documentation's, and in the page's order: what Core-Geth is,
 * which networks, where releases come from, what an operator does first, which
 * guide to start with, the security records, and links into the documentation.
 * Versions, advisory counts and fork schedules stay on the documentation pages that
 * maintain them.
 */

/** Wraps prose at 110 columns, the width of the documentation's llms.txt. */
const wrap = (text: string, prefix = "", width = 110): string =>
  text
    .split(" ")
    .reduce((lines: string[], word) => {
      const last = lines.at(-1);
      if (last !== undefined && `${last} ${word}`.length <= width - prefix.length) {
        lines[lines.length - 1] = `${last} ${word}`;
      } else {
        lines.push(word);
      }
      return lines;
    }, [])
    .map((line) => `${prefix}${line}`)
    .join("\n");

const entry = (page: DocPage): string => `- [${page.title}](${page.href}): ${page.summary}`;

/** A link in this file is read away from the site, so a site-relative href is spelled out. */
const absolute = (href: string): string => (href.startsWith("/") ? `${SITE_URL}${href}` : href);

export const GET: APIRoute = () => {
  const text = [
    `# ${SITE_NAME}`,
    "",
    wrap(
      `${SITE_NAME} is a production execution client for the Ethereum Classic network, maintained at [github.com/${REPO.slug}](${REPO.url}) in the \`ethereumclassic\` GitHub organization. ${ABOUT.definition} ${ABOUT.maintained}`,
      "> ",
    ),
    "",
    wrap(
      `${SITE_URL}/ is the project's landing page, ${SITE_URL}/downloads/ lists every file the latest release published and how to verify one, ${SITE_URL}/security/ carries the audits and what the network is running, ${SITE_URL}/about/ carries the project's lineage, and ${SITE_URL}/sponsor/ says who maintains and funds the client and how to sponsor it. The documentation at ${DOCS.home.href} is where to install, run and operate a node, and where the audits and release records are published.`,
    ),
    "",
    "## Networks",
    "",
    wrap(ABOUT.oneNode),
    "",
    ...NETWORKS.map(
      (network) =>
        `- ${network.name}, chain ID ${network.chainId} (${network.role}), selected with \`${network.flag}\`: [${network.guide.title}](${network.guide.href})`,
    ),
    "",
    "## Releases",
    "",
    `- [${REPO.slug}](${REPO.releasesUrl}): where releases are published. ${PREVIOUS_NAMESPACE}`,
    `- [Downloads](${SITE_URL}/downloads/): every archive and container image the latest release published, for Linux, macOS, Windows and Arm, with the checksum beside each one.`,
    `- [The latest release](${REPO.latestUrl}): the address every download on this site links, so it resolves to whatever is current.`,
    "",
    wrap(
      `Every archive and image is published with a \`.sha256\` checksum and a GitHub build attestation, minted against a short-lived certificate issued to the workflow run, recording which workflow built the file from which commit. Check them with \`sha256sum -c\` and \`gh attestation verify\`. On a first run Windows names the publisher as unknown, and macOS blocks a downloaded binary until it is allowed.`,
    ),
    "",
    wrap(TRANSITION.lede),
    "",
    entry(DOCS.transition),
    "",
    "## What the network is running",
    "",
    wrap(NETWORK_RUNNING.lede),
    "",
    wrap(
      `Core-Geth nodes by release on ${NETWORK_RUNNING.measured.text}, ${NETWORK_RUNNING.total} in all, from [${NETWORK_RUNNING.source.label}](${NETWORK_RUNNING.source.href}):`,
    ),
    "",
    ...NETWORK_RUNNING.rows.map(
      (row) =>
        `- ${row.running}: ${row.nodes} nodes, ${row.share}, ${row.status}: ${row.summary}. ${row.detail}`,
    ),
    `- [What the network is running](${SITE_URL}/security/): this table, the audits behind it, and how to report a security issue.`,
    `- [The evidence for each row](${NETWORK_RUNNING.evidence})`,
    `- [${NETWORK_RUNNING.upgrade.label}](${NETWORK_RUNNING.upgrade.href})`,
    "",
    "## For node operators",
    "",
    ...OPERATOR_ACTIONS.map((action) => {
      const name = action.href
        ? `[${action.text}](${action.href})`
        : `${action.text}${action.code ? `\`${action.code}\`` : ""}`;
      return action.detail ? `- ${name}: ${action.detail}` : `- ${name}`;
    }),
    entry(DOCS.operators),
    "",
    "## Start here",
    "",
    ...[DOCS.home, DOCS.installation, DOCS.history, DOCS.faq].map(entry),
    "",
    "## Find your guide",
    "",
    ...GUIDES.map((guide) => `- ${guide.role}: [${guide.title}](${guide.href})`),
    entry(DOCS.guides),
    "",
    "## Security and provenance",
    "",
    `What the ${RECOMMENDED_LINE} line fixes:`,
    "",
    wrap(RELEASE_FIXES.replaceAll("`", "")),
    "",
    `- [Security and provenance](${SITE_URL}/security/): what the audits found, what the releases fixed, and which releases the network still runs.`,
    `- [About Core-Geth](${SITE_URL}/about/): the code's lineage, the organizations that led and funded it, and the move to the \`ethereumclassic\` organization.`,
    ...RECORDS.map(
      (record) =>
        `- ${record.label}: [${record.page.title}](${absolute(record.page.href)}). ${record.summary}`,
    ),
    "",
    `The ${EXPOSED_LINE} audits and the ${RECOMMENDED_LINE} release reports behind every figure above, each naming the release line it covers:`,
    "",
    ...AUDITS.map(
      (audit) =>
        `- [${audit.title}](${absolute(audit.href)}), ${audit.date.text}: ${audit.summary.replaceAll("`", "")}`,
    ),
    "",
    "Every release and event in this record, in order, each release naming the repository that published it:",
    "",
    ...RELEASE_TIMELINE.map((item) => {
      const quote = item.quote ? ` "${item.quote.text}" (${item.quote.source}).` : "";
      return `- ${item.when}, ${item.title.replaceAll("`", "")}: ${item.body}${quote}`;
    }),
    "",
    "## Who maintains and funds this",
    "",
    wrap(SPONSOR.intro.replaceAll("`", "")),
    "",
    wrap(SPONSOR.maintainers.history),
    "",
    ...SPONSOR.funders.rows.map((row) => `- ${row.years}: ${row.organization}`),
    "",
    wrap(SPONSOR.funders.note),
    "",
    `- [Sponsor Core-Geth](${SITE_URL}/sponsor/): who maintains it, who has funded it, and how to sponsor it.`,
    entry(DOCS.support),
    "",
    "## Contact and support",
    "",
    ...CONTACT.map(
      (item) =>
        `- ${item.heading}: ${item.body} ${item.links.map((link) => `[${link.label}](${absolute(link.href)})`).join(", ")}`,
    ),
    entry(DOCS.support),
    "",
  ].join("\n");

  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
