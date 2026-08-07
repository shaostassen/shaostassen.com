import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Vendored from the electrons-to-instructions repo. Linting a synced
      // copy is churn: the sync rsyncs --delete, so a fix applied here is
      // destroyed on the next sync. It is still fully covered by
      // `pnpm typecheck` — the check that would actually catch a breaking
      // change — and carries its own 70-test suite upstream.
      "src/components/electrons/**",
    ],
  },
  {
    // Tool configs that are loaded as CommonJS — lhci resolves
    // lighthouserc.cjs with require(), so `require()` is the correct
    // module syntax here, not a lapse.
    files: ["**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];

export default eslintConfig;
