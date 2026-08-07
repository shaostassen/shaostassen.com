import { test, expect } from "@playwright/test";

/**
 * The contract between the export and whatever serves it.
 *
 * These pin the rules in scripts/serve-static.mjs, which deploy/Caddyfile and
 * deploy/nginx.conf implement for real hosts. Each one is a way a static
 * server can be wrong without anything looking broken in development.
 */

test("clean URLs resolve without .html", async ({ page }) => {
  // The site links to /about; the export contains about.html. A server
  // without an .html fallback 404s every internal link on the site.
  for (const path of [
    "/",
    "/about",
    "/projects",
    "/coursework",
    "/contact",
    "/colophon",
    "/projects/fast-robots",
    "/projects/electrons/lab",
  ]) {
    const res = await page.request.get(path);
    expect(res.status(), `${path} should resolve`).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/html");
  }
});

test("unknown paths return a real 404 status, not a 200 soft-404", async ({
  page,
}) => {
  const res = await page.request.get("/no-such-page", {
    failOnStatusCode: false,
  });
  expect(res.status()).toBe(404);
  expect(await res.text()).toContain("Nothing at this address");
});

test("generated OG cards are served as PNG despite having no extension", async ({
  page,
}) => {
  // Next writes these as `…/opengraph-image` with no file extension. Guessed
  // by extension they come back application/octet-stream — which is exactly
  // what shaostassen.com serves today, and what some scrapers refuse to
  // render. Self-hosting is what lets this be fixed.
  for (const path of [
    "/opengraph-image",
    "/projects/fast-robots/opengraph-image",
  ]) {
    const res = await page.request.get(path);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"], path).toBe("image/png");
    const bytes = await res.body();
    expect(bytes.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }
});

test("cache policy: hashed assets immutable, documents revalidated", async ({
  page,
}) => {
  const html = await page.request.get("/");
  // HTML must revalidate, or a deploy never reaches anyone holding a copy.
  expect(html.headers()["cache-control"]).toContain("must-revalidate");

  // Find a real content-hashed asset from the page rather than guessing one.
  await page.goto("/");
  const asset = await page.evaluate(() => {
    const el = document.querySelector<HTMLScriptElement>(
      'script[src*="/_next/static/"]',
    );
    return el?.getAttribute("src") ?? null;
  });
  expect(asset, "expected a hashed _next/static asset").toBeTruthy();

  const res = await page.request.get(asset!);
  expect(res.status()).toBe(200);
  expect(res.headers()["cache-control"]).toContain("immutable");
});

test("the video accepts range requests so it can be seeked", async ({
  page,
}) => {
  const path = "/projects/super-gold-hunters/gameplay.mp4";
  const head = await page.request.head(path);
  expect(head.headers()["accept-ranges"]).toBe("bytes");

  const res = await page.request.get(path, {
    headers: { Range: "bytes=0-1023" },
  });
  expect(res.status()).toBe(206);
  expect(res.headers()["content-range"]).toMatch(/^bytes 0-1023\/\d+$/);
  expect((await res.body()).byteLength).toBe(1024);
});

test("security headers are set on documents", async ({ page }) => {
  const res = await page.request.get("/");
  const h = res.headers();

  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["permissions-policy"]).toContain("geolocation=()");

  const csp = h["content-security-policy"];
  expect(csp).toBeTruthy();
  // Every origin pinned to self, and the page cannot be framed.
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
});

test("path traversal cannot escape the served directory", async ({ page }) => {
  for (const attack of [
    "/../package.json",
    "/..%2f..%2fpackage.json",
    "/_next/../../package.json",
  ]) {
    const res = await page.request.get(attack, { failOnStatusCode: false });
    expect([404, 400], `${attack} must not serve a file`).toContain(
      res.status(),
    );
    expect(await res.text()).not.toContain('"name": "shaostassen.com"');
  }
});
