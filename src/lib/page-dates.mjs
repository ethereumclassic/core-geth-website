// @ts-check
/**
 * Dates each sitemap entry by its own page.
 *
 * Google uses `<lastmod>` only "if it's consistently and verifiably (for example by comparing
 * to the last modification of the page) accurate", and counts as significant an update to the
 * main content, the structured data or the links on the page. So an entry keeps its date for as
 * long as those have not changed, and moves when they do.
 *
 * Each build compares every page it wrote with the same page live on coregeth.com, which the
 * previous deploy built. Unchanged, the entry keeps the date the live sitemap gives it. Changed,
 * new, or with the live copy unreadable, it takes the build's time, which is what every entry
 * took before this module: a failure here can make a date too new, and never hides a change.
 *
 * Nothing in it may throw: `@astrojs/sitemap` answers an error from `serialize` by logging it and
 * writing no sitemap at all, without failing the build.
 *
 * Plain JavaScript, because astro.config.mjs imports it before anything compiles TypeScript.
 */
import { readFile } from "node:fs/promises";

/** Every lastmod this site writes, so a value read back from the live sitemap can be trusted. */
const STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

/**
 * The attributes of one start tag. Astro escapes `>` inside attribute values, so a tag ends at
 * the first `>`.
 *
 * @param {string} tag
 * @returns {Record<string, string>}
 */
function attributes(tag) {
  /** @type {Record<string, string>} */
  const found = {};
  for (const m of tag.matchAll(/([^\s=/<>"']+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    found[(m[1] ?? "").toLowerCase()] = m[2] ?? m[3] ?? "";
  }
  return found;
}

/**
 * What a search engine counts as a significant change, as one string: the title, description,
 * canonical and robots rules, every block of structured data, and the main content's text and
 * links. Markup, classes, styles, scripts and the shared header and footer are left out, so a
 * change to them alone leaves a page's date where it was.
 *
 * @param {string} html
 * @returns {string}
 */
export function significant(html) {
  const head = [`title=${html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""}`];
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attributes(tag);
    if (a.name === "description" || a.name === "robots") head.push(`${a.name}=${a.content ?? ""}`);
  }
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const a = attributes(tag);
    if (a.rel === "canonical") head.push(`canonical=${a.href ?? ""}`);
  }
  const data = [
    ...html.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ].map((m) => m[1] ?? "");
  const main = (html.match(/<main\b[^>]*>([\s\S]*)<\/main>/i)?.[1] ?? "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "");
  const links = [];
  for (const [tag] of main.matchAll(/<[a-z][^>]*>/gi)) {
    const href = attributes(tag).href;
    if (href !== undefined) links.push(href);
  }
  const text = main
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return JSON.stringify({ head, data, links, text });
}

/**
 * Each `<loc>` in a sitemap, with its `<lastmod>` where it has one.
 *
 * @param {string} xml
 * @returns {Map<string, string | undefined>}
 */
export function parseSitemap(xml) {
  /** @type {Map<string, string | undefined>} */
  const entries = new Map();
  for (const [, body = ""] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = body.match(/<loc>\s*([^<]*?)\s*<\/loc>/)?.[1];
    if (loc) entries.set(loc, body.match(/<lastmod>\s*([^<]*?)\s*<\/lastmod>/)?.[1]);
  }
  return entries;
}

/**
 * @param {object} options
 * @param {string} options.site The live origin the previous deploy published, with no trailing slash.
 * @param {typeof fetch} [options.fetchFn]
 * @param {Date} [options.now] The build's time, given to every entry that changed.
 */
export function pageDates({ site, fetchFn = fetch, now = new Date() }) {
  const buildTime = now.toISOString();
  // A query the CDN has not seen, so each build reads the deployed files rather than a cached copy.
  const fresh = `page-dates=${now.getTime()}`;
  /** @type {URL | undefined} */
  let outDir;
  /** @type {Pick<import("astro").AstroIntegrationLogger, "info" | "warn">} */
  let logger = { info: console.log, warn: console.warn };
  /** @type {Promise<Map<string, string | undefined>> | undefined} */
  let live;
  /** @type {Map<string, Promise<string>>} */
  const livePages = new Map();
  let warnedLive = false;

  /** @param {string} url */
  const read = async (url) => {
    const response = await fetchFn(`${url}?${fresh}`, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  };

  // The live sitemap, read once, and every page it lists, read side by side as soon as it is in.
  const liveSitemap = () =>
    (live ??= read(`${site}/sitemap-0.xml`).then((xml) => {
      const entries = parseSitemap(xml);
      if (entries.size === 0) throw new Error("it lists no URL");
      for (const url of entries.keys()) {
        const page = read(url);
        page.catch(() => {}); // Handled where it is awaited; this only keeps Node from aborting.
        livePages.set(url, page);
      }
      return entries;
    }));

  /**
   * @param {string} url
   * @returns {Promise<string>}
   */
  async function dateFor(url) {
    const path = new URL(url).pathname;
    try {
      if (!outDir) throw new Error("the output directory is unknown");
      const built = await readFile(new URL(`.${path}index.html`, outDir), "utf8");
      let entries;
      try {
        entries = await liveSitemap();
      } catch (error) {
        if (!warnedLive) {
          logger.warn(
            `the live sitemap is unreadable (${error}); every entry takes this build's time`,
          );
          warnedLive = true;
        }
        return buildTime;
      }
      const previous = entries.get(url);
      const page = livePages.get(url);
      if (!page) {
        logger.info(`${path} is new`);
        return buildTime;
      }
      if (!previous || !STAMP.test(previous) || Date.parse(previous) > now.getTime()) {
        logger.warn(`${path}: the live sitemap's date is missing or invalid (${previous})`);
        return buildTime;
      }
      if (significant(await page) === significant(built)) {
        logger.info(`${path} unchanged, keeps ${previous}`);
        return previous;
      }
      logger.info(`${path} changed`);
      return buildTime;
    } catch (error) {
      logger.warn(`${path}: ${error}; it takes this build's time`);
      return buildTime;
    }
  }

  /** @type {import("astro").AstroIntegration} */
  const integration = {
    name: "page-dates",
    hooks: {
      "astro:config:done": ({ config, logger: astroLogger }) => {
        outDir = config.outDir;
        logger = astroLogger;
      },
    },
  };

  return {
    integration,
    dateFor,
    /** @param {import("@astrojs/sitemap").SitemapItem} item */
    serialize: async (item) => ({ ...item, lastmod: await dateFor(item.url) }),
  };
}
