import type { APIRoute } from "astro";
import {
  ABOUT,
  CONTACT,
  DOCS,
  type DocPage,
  GUIDES,
  NETWORKS,
  OPERATOR_ACTIONS,
  PREVIOUS_NAMESPACE,
  RECORDS,
  REPO,
  SITE_NAME,
  SITE_URL,
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

export const GET: APIRoute = () => {
  const text = [
    `# ${SITE_NAME}`,
    "",
    wrap(
      `${SITE_NAME} is the Ethereum Classic execution client, maintained at [github.com/${REPO.slug}](${REPO.url}) in the Ethereum Classic community's GitHub organization. ${ABOUT.definition} ${ABOUT.upstream}`,
      "> ",
    ),
    "",
    wrap(
      `${SITE_URL}/ is the project's landing page. The documentation at ${DOCS.home.href} is where to install, run and operate a node, and where the audits and release records are published.`,
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
    "",
    wrap(TRANSITION.lede),
    "",
    entry(DOCS.transition),
    "",
    "## For node operators",
    "",
    ...OPERATOR_ACTIONS.map(
      (action) => `- ${action.text}${action.code ? `\`${action.code}\`` : ""}`,
    ),
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
    ...RECORDS.map(
      (record) =>
        `- ${record.label}: [${record.page.title}](${record.page.href}). ${record.summary}`,
    ),
    "",
    "## Contact and support",
    "",
    ...CONTACT.map(
      (item) =>
        `- ${item.heading}: ${item.body} ${item.links.map((link) => `[${link.label}](${link.href})`).join(", ")}`,
    ),
    entry(DOCS.support),
    "",
  ].join("\n");

  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
