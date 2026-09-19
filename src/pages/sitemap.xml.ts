import type { APIRoute } from "astro";
import { SITE_URL } from "@/data/site";

/**
 * Serves /sitemap.xml, the path a reader or a third-party tool tries first.
 *
 * `@astrojs/sitemap` writes its index as `sitemap-index.xml` and cannot be made to
 * write this name: its `filenameBase` option renames the stem of both files and keeps
 * the `-index` suffix. `public/robots.txt` names the integration's index, and this
 * route is the alias for whoever never reads robots.txt.
 *
 * It points at the generated sitemap instead of listing any URL of its own, so adding
 * a page cannot leave it stale. `sitemap-0.xml` is the only sitemap this build writes:
 * the integration starts a second file at its `entryLimit`, 45,000 URLs. If a build
 * ever writes `sitemap-1.xml`, this route has to list that too.
 */
export const GET: APIRoute = () => {
  // The build's date, as the integration stamps on its own index.
  const lastmod = new Date().toISOString();
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `<sitemap><loc>${SITE_URL}/sitemap-0.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`,
    "</sitemapindex>",
    "",
  ].join("\n");

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
