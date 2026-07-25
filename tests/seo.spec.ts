import { test, expect } from "@playwright/test";

test("sitemap lists every route", async ({ page }) => {
  const res = await page.request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml = await res.text();
  for (const path of [
    "/about",
    "/projects",
    "/coursework",
    "/contact",
    "/projects/fast-robots",
    "/projects/parallel-spgemm",
    "/projects/ml-workstation-edge-pipeline",
  ]) {
    expect(xml).toContain(path);
  }
  expect(xml).not.toContain("/styleguide");
});

test("robots.txt allows crawling and points at the sitemap", async ({
  page,
}) => {
  const res = await page.request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const txt = await res.text();
  expect(txt).toContain("Allow: /");
  expect(txt).toContain("Sitemap:");
  expect(txt).toContain("/sitemap.xml");
});

test("landing has OG/Twitter cards and a working og image", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Shao Stassen",
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  await expect(page.locator('meta[property="og:image:type"]')).toHaveAttribute(
    "content",
    "image/png",
  );

  const ogImage = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  expect(ogImage).toBeTruthy();
  const res = await page.request.get(new URL(ogImage!).pathname);
  expect(res.status()).toBe(200);
  // Next exports metadata images without a file extension, so assert the
  // bytes are a real PNG rather than trusting the server's content-type.
  const bytes = await res.body();
  expect(bytes.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
  expect(bytes.byteLength).toBeGreaterThan(5000);
});

test("project page has its own title and og image", async ({ page }) => {
  await page.goto("/projects/parallel-spgemm");
  await expect(page).toHaveTitle(
    "Parallel Sparse Matrix–Matrix Multiplication — Shao Stassen",
  );
  const ogImage = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  expect(ogImage).toBeTruthy();
  expect(ogImage).toContain("/projects/parallel-spgemm/opengraph-image");
  const res = await page.request.get(new URL(ogImage!).pathname);
  expect(res.status()).toBe(200);
});

test("json-ld person is present on landing and about", async ({ page }) => {
  for (const path of ["/", "/about"]) {
    await page.goto(path);
    const raw = await page
      .locator('script[type="application/ld+json"]')
      .textContent();
    const data = JSON.parse(raw!);
    expect(data["@type"]).toBe("Person");
    expect(data.name).toBe("Shao Stassen");
    expect(data.sameAs).toContain("https://www.linkedin.com/in/shaostassen");
  }
});
