// @ts-check
import { defineConfig } from "eslint/config";
import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

// eslint-plugin-astro is ESM-only and requires flat config and ESLint 10 or later.
// Its jsx-a11y configs are not wired in: they need eslint-plugin-jsx-a11y, which is
// not installed. Accessibility is checked by hand against the rendered page.
export default defineConfig(
  { ignores: ["dist/", ".astro/", "node_modules/", ".local/"] },
  eslintPluginAstro.configs.recommended,
  {
    files: ["**/*.ts"],
    extends: [tseslint.configs.recommended],
  },
);
