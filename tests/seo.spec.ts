import { test, expect } from "@playwright/test";

const SITE = "https://shaostassen.com";

// Every indexable route, with the title its social card must advertise.
const routes = [
  { path: "/", title: "Shao Stassen" },
  { path: "/about", title: "About — Shao Stassen" },
  { path: "/projects", title: "Projects — Shao Stassen" },
  { path: "/coursework", title: "Coursework — Shao Stassen" },
  { path: "/contact", title: "Contact — Shao Stassen" },
  { path: "/colophon", title: "Colophon — Shao Stassen" },
  {
    path: "/projects/fast-robots",
    title:
      "Fast Robots: Sensor Fusion and Autonomous Navigation — Shao Stassen",
  },
  {
    path: "/projects/parallel-spgemm",
    title: "Parallel Sparse Matrix–Matrix Multiplication — Shao Stassen",
  },
  {
    path: "/projects/super-gold-hunters",
    title: "Super Gold Hunters — Shao Stassen",
  },
];

const content = (page: import("@playwright/test").Page, selector: string) =>
  page.locator(selector).getAttribute("content");

for (const { path, title } of routes) {
  // Regression guard for S7.3: every page used to advertise the site title
  // and og:url = the homepage, so sharing a case study rendered a generic
  // card pointing at "/". The identity has to be per-route.
  test(`social card identifies ${path} as itself`, async ({ page }) => {
    await page.goto(path);
    const expected = `${SITE}${path === "/" ? "" : path}`;

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      expected,
    );
    expect(await content(page, 'meta[property="og:url"]')).toBe(expected);
    expect(await content(page, 'meta[property="og:title"]')).toBe(title);
    expect(await content(page, 'meta[name="twitter:title"]')).toBe(title);

    // The page description, not the site's — except on the landing page,
    // where they are legitimately the same string.
    const ogDescription = await content(
      page,
      'meta[property="og:description"]',
    );
    const metaDescription = await content(page, 'meta[name="description"]');
    expect(ogDescription).toBe(metaDescription);
    expect(ogDescription?.length).toBeGreaterThan(0);

    // Declaring a per-page openGraph object replaces the layout's outright,
    // so these have to survive the merge on every route.
    expect(await content(page, 'meta[property="og:site_name"]')).toBe(
      "Shao Stassen",
    );
    expect(await content(page, 'meta[name="twitter:card"]')).toBe(
      "summary_large_image",
    );

    // Likewise the image: an ancestor segment's file-convention image is
    // dropped once a descendant declares openGraph.
    const ogImage = await content(page, 'meta[property="og:image"]');
    expect(ogImage).toBeTruthy();
    const imageRes = await page.request.get(new URL(ogImage!).pathname);
    expect(imageRes.status()).toBe(200);
  });
}

test("case studies are articles and carry their own og image", async ({
  page,
}) => {
  await page.goto("/projects/fast-robots");
  expect(await content(page, 'meta[property="og:type"]')).toBe("article");
  expect(await content(page, 'meta[property="og:image"]')).toContain(
    "/projects/fast-robots/opengraph-image",
  );

  // Non-case-study routes stay websites on the site-wide image.
  await page.goto("/about");
  expect(await content(page, 'meta[property="og:type"]')).toBe("website");
  expect(await content(page, 'meta[property="og:image"]')).toContain(
    "/opengraph-image",
  );
});

test("site icons are declared and actually resolve", async ({ page }) => {
  await page.goto("/");
  const links = page.locator('link[rel="icon"], link[rel="apple-touch-icon"]');
  // .ico for legacy, .svg for modern, apple-touch-icon for iOS home screens
  await expect(links).toHaveCount(3);

  const rels = new Set<string>();
  for (const el of await links.all()) {
    const href = await el.getAttribute("href");
    rels.add((await el.getAttribute("rel")) ?? "");
    expect(href).toBeTruthy();
    const res = await page.request.get(new URL(href!, "http://x").pathname);
    expect(res.status(), `${href} should resolve`).toBe(200);
    expect((await res.body()).byteLength).toBeGreaterThan(500);
  }
  expect([...rels].sort()).toEqual(["apple-touch-icon", "icon"]);
});

test("the nav logo is decorative, so the home link reads as one thing", async ({
  page,
}) => {
  await page.goto("/");
  const home = page.getByRole("banner").getByRole("link").first();
  // The mark must not add a second accessible name to the link.
  await expect(home).toHaveAccessibleName("shaostassen.com");
  await expect(home.locator("svg[aria-hidden='true']")).toHaveCount(1);
});

test("the 404 claims no canonical", async ({ page }) => {
  await page.goto("/definitely-not-a-page");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

test("sitemap lists every route", async ({ page }) => {
  const res = await page.request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml = await res.text();
  for (const path of [
    "/about",
    "/projects",
    "/coursework",
    "/contact",
    "/colophon",
    "/projects/fast-robots",
    "/projects/parallel-spgemm",
    "/projects/speechlens",
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
