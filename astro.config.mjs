// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { pageDates } from "./src/lib/page-dates.mjs";

// GitHub Pages serves this site at the domain root, coregeth.com (public/CNAME),
// so there is no `base` path. `site` makes the canonical, Open Graph and sitemap
// URLs absolute. public/robots.txt names https://coregeth.com/sitemap.xml, the alias
// route in src/pages/sitemap.xml.ts that points at this integration's sitemap-0.xml,
// so that output filename is part of the deploy contract.
const site = "https://coregeth.com";

// Each sitemap entry is dated by its own page: the time of the last build that changed what a
// search engine counts as significant there, compared against the page live on this site.
// src/lib/page-dates.mjs says how.
const dates = pageDates({ site });

export default defineConfig({
  site,
  output: "static",
  // coregeth.com/discord is the project's own short link for the community channel. It
  // forwards to ethereumclassic.com/discord rather than to an invite code, so the invite
  // stays maintained in one place and this site never holds a stale one. A static build
  // emits an HTML page that refreshes, with a canonical link to the target.
  redirects: { "/discord": "https://ethereumclassic.com/discord" },
  integrations: [
    dates.integration,
    // The redirect is not a page of this site, so it is kept out of the sitemap.
    sitemap({ filter: (page) => !page.endsWith("/discord/"), serialize: dates.serialize }),
  ],
});
