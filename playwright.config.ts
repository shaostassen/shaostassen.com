import { defineConfig, devices } from "@playwright/test";

// Smoke tests run against the real static export (out/), not the dev server,
// so what passes here is what ships.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // `pnpm test` on its own builds first, so what it serves is never stale.
    // `pnpm validate` and CI have already built by the time they get here,
    // and rebuilding cost a second full Next build every run — set
    // PLAYWRIGHT_NO_BUILD=1 to serve the existing out/ instead.
    // Served by scripts/serve-static.mjs — the same ruleset deploy/Caddyfile
    // and deploy/nginx.conf implement, so the suite proves the self-hosting
    // config rather than a generic dev server's conveniences.
    command: process.env.PLAYWRIGHT_NO_BUILD
      ? "node scripts/serve-static.mjs --port 4173"
      : "pnpm build && node scripts/serve-static.mjs --port 4173",
    url: "http://localhost:4173",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
