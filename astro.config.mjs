// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// GitHub Pages serves this site at the domain root, coregeth.com (public/CNAME),
// so there is no `base` path. `site` makes the canonical, Open Graph and sitemap
// URLs absolute. public/robots.txt names https://coregeth.com/sitemap-index.xml,
// so the integration's output filenames are part of the deploy contract.
//
// Each page's lastmod is the build's date. That is true rather than approximate:
// the build reads the repository card's counts and release from GitHub, so every
// build changes the page.
export default defineConfig({
  site: "https://coregeth.com",
  output: "static",
  // coregeth.com/discord is the project's own short link for the community channel. It
  // forwards to ethereumclassic.com/discord rather than to an invite code, so the invite
  // stays maintained in one place and this site never holds a stale one. A static build
  // emits an HTML page that refreshes, with a canonical link to the target.
  redirects: { "/discord": "https://ethereumclassic.com/discord" },
  // The redirect is not a page of this site, so it is kept out of the sitemap.
  integrations: [sitemap({ lastmod: new Date(), filter: (page) => !page.endsWith("/discord/") })],
});
