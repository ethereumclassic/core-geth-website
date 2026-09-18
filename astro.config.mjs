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
  integrations: [sitemap({ lastmod: new Date() })],
});
