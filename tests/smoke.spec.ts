import { test, expect } from "@playwright/test";

test("home page renders without console errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  const response = await page.goto("/");
  expect(response?.status()).toBe(200);

  await expect(page).toHaveTitle(/Shao Stassen/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Shao Stassen",
  );
  await expect(page.getByRole("link", { name: "GitHub ↗" })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("featured projects strip renders from typed content", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Things I have built" }),
  ).toBeVisible();
  // Behavioural, not inventory: the strip is whatever content marks
  // featured, so assert it is non-empty and shows real data.
  const cards = page.getByRole("heading", { level: 3 });
  expect(await cards.count()).toBeGreaterThan(0);
  await expect(page.getByText("~21× on 32 cores")).toBeVisible();
});

test("listing-only projects are shown but not linked", async ({ page }) => {
  await page.goto("/projects");
  // SpeechLens has caseStudy:false — present, but no route and no link.
  await expect(page.getByRole("heading", { name: "SpeechLens" })).toBeVisible();
  await expect(page.getByRole("link", { name: /SpeechLens/ })).toHaveCount(0);

  const res = await page.request.get("/projects/speechlens", {
    failOnStatusCode: false,
  });
  expect(res.status()).toBe(404);

  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/projects/speechlens");
});

test("nav hides on scroll down and reveals on scroll up", async ({ page }) => {
  await page.goto("/");
  const room = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  test.skip(room < 300, "page not scrollable enough at this viewport");

  const header = page.locator("header");
  await page.mouse.move(300, 300);
  await page.mouse.wheel(0, 700);
  await expect(header).toHaveClass(/-translate-y-full/);
  // two separate up-wheels so a scroll event definitely lands after the
  // rAF from the previous batch
  await page.mouse.wheel(0, -150);
  await page.mouse.wheel(0, -150);
  await expect(header).not.toHaveClass(/-translate-y-full/);
});

test("unknown routes return a designed 404 that routes back", async ({
  page,
}) => {
  const response = await page.goto("/definitely-not-a-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Nothing at this address",
  );
  await expect(page).toHaveTitle("Not found — Shao Stassen");

  // it is a real page in the site's chrome, not Next's stock screen
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();

  await page.getByRole("link", { name: "projects →" }).click();
  await expect(page).toHaveURL(/\/projects/);
});

test("app shell: skip link is first tab stop, landmarks present", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: /skip to content/i }),
  ).toBeFocused();
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toContainText("source");
});

test("colophon documents the stack and links from the footer", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "colophon" })
    .click();
  await expect(page).toHaveURL(/\/colophon/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Colophon");
  await expect(
    page.getByRole("heading", { name: "Decisions worth explaining" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "What I would do next" }),
  ).toBeVisible();
});

test("theme toggle overrides the system theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await page.getByRole("button", { name: /toggle theme/i }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  // override survives a reload (localStorage + pre-paint script)
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("case study renders from validated MDX", async ({ page }) => {
  await page.goto("/projects/fast-robots");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Fast Robots",
  );
  await expect(
    page.getByRole("heading", { name: /technically hard/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /full reports/i })).toBeVisible();
});

test("landing card links to the case study", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Fast Robots/ }).click();
  await expect(page).toHaveURL(/\/projects\/fast-robots/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Fast Robots",
  );
});

test("projects index groups by track and filters by category", async ({
  page,
}) => {
  await page.goto("/projects");
  await expect(
    page.getByRole("heading", { name: "School work" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Individual work" }),
  ).toBeVisible();
  const cards = page.getByRole("heading", { level: 3 });
  const total = await cards.count();
  expect(total).toBeGreaterThan(0);

  // Filtering narrows the set and pins the URL; assert the relationship
  // rather than today's project count.
  await page.getByRole("button", { name: "Robotics" }).click();
  await expect(page.getByRole("button", { name: "Robotics" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page).toHaveURL(/category=robotics/);
  const robotics = await cards.count();
  expect(robotics).toBeGreaterThan(0);
  expect(robotics).toBeLessThan(total);
  await expect(
    page.getByRole("heading", { level: 3, name: /Fast Robots/ }),
  ).toBeVisible();

  // A category with nothing in it shows the edge state in both tracks.
  await page.getByRole("button", { name: "Embedded" }).click();
  await expect(cards).toHaveCount(0);
  await expect(
    page.getByText("no projects in this category yet").first(),
  ).toBeVisible();
});

test("projects filter deep-links via URL", async ({ page }) => {
  await page.goto("/projects?category=systems-hpc");
  await expect(
    page.getByRole("button", { name: "Systems · HPC" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("heading", { level: 3, name: /Sparse Matrix/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: /Edge Pipeline/ }),
  ).toBeVisible();
});

test("about page renders bio and evidence-linked skills", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("About");
  await expect(page.getByText(/Cornell \(Class of 2026\)/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "What I work in" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Controls & estimation" }),
  ).toBeVisible();
  // a skill links to the project that evidences it
  await page.getByRole("link", { name: "Kalman filtering" }).click();
  await expect(page).toHaveURL(/\/projects\/fast-robots/);
});

test("nav links to about (via disclosure menu on mobile)", async ({ page }) => {
  await page.goto("/");
  const menuButton = page.getByRole("button", { name: "Menu" });
  if (await menuButton.isVisible()) {
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await menuButton.click();
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  }
  await page
    .getByRole("banner")
    .getByRole("link", { name: "About" })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(/\/about/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("About");
});

test("individual work renders and prev/next navigation works", async ({
  page,
}) => {
  await page.goto("/projects");
  await expect(
    page.getByRole("heading", { name: "ML Workstation → Edge Pipeline" }),
  ).toBeVisible();
  // the individual track no longer shows the empty state
  await expect(page.getByText("write-ups in progress")).toHaveCount(0);

  await page.goto("/projects/parallel-spgemm");
  const moreNav = page.getByRole("navigation", { name: "More projects" });
  await expect(moreNav.getByRole("link")).toHaveCount(2);
  await moreNav.getByRole("link", { name: /Edge Pipeline/ }).click();
  await expect(page).toHaveURL(/ml-workstation-edge-pipeline/);
});

test("about page shows experience and education timelines", async ({
  page,
}) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "Experience" })).toBeVisible();
  // heading-scoped: the bio paragraph also contains "Smith & Nephew"
  await expect(
    page.getByRole("heading", { level: 3, name: "Smith & Nephew" }),
  ).toBeVisible();
  await expect(page.getByText("Fall 2024 — Spring 2026")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Education" })).toBeVisible();
  await expect(page.getByText("Cornell University")).toBeVisible();
});

test("coursework page links out to fast robots reports", async ({ page }) => {
  await page.goto("/coursework");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Coursework",
  );
  await expect(
    page.getByRole("link", { name: /full lab reports/ }),
  ).toHaveAttribute("href", /shaostassen\.github\.io/);
  // no iframe — the reports are linked, not embedded
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.getByRole("link", { name: "SpGEMM case study →" }).click();
  await expect(page).toHaveURL(/\/projects\/parallel-spgemm/);
});

test("contact page: obfuscated email assembles client-side only", async ({
  page,
}) => {
  // the prerendered HTML must never contain the address or a mailto:
  const res = await page.request.get("/contact");
  const rawHtml = await res.text();
  expect(rawHtml).not.toContain("shaostassen225@gmail.com");
  expect(rawHtml).not.toContain("mailto:");

  // after hydration the human-usable link exists
  await page.goto("/contact");
  const emailLink = page.getByRole("link", {
    name: "shaostassen225@gmail.com",
  });
  await expect(emailLink).toBeVisible();
  await expect(emailLink).toHaveAttribute(
    "href",
    "mailto:shaostassen225@gmail.com",
  );
  await expect(page.getByRole("button", { name: "copy" })).toBeVisible();
  await expect(page.getByRole("link", { name: "LinkedIn ↗" })).toBeVisible();
});

test("styleguide is not exposed in production builds", async ({ page }) => {
  await page.goto("/styleguide");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Nothing at this address",
  );
  await expect(page.getByText(/color tokens/i)).toHaveCount(0);
});

// --- S8.1: the PID demo ---------------------------------------------------

/** Overshoot percentage parsed out of the plot's accessible summary. */
async function overshootOf(page: import("@playwright/test").Page) {
  const label = await page
    .getByRole("img", { name: /Step response plot/ })
    .getAttribute("aria-label");
  return Number(/Overshoot (-?[\d.]+) percent/.exec(label ?? "")?.[1]);
}

test("pid demo is fully rendered in the export, before any JS runs", async ({
  page,
}) => {
  // The simulation is deterministic precisely so the default curve ships in
  // the HTML — a visitor without JS gets a real chart, just no sliders.
  const raw = await (await page.request.get("/projects/fast-robots")).text();
  expect(raw).toContain("<polyline");
  expect(raw).toContain("Step response plot");
  // both traces (output + control effort) and every control
  expect(raw.match(/<polyline/g)).toHaveLength(2);
  expect(raw.match(/type="range"/g)).toHaveLength(3);
  expect(raw).toContain('type="checkbox"');
  // real computed numbers, not placeholders
  expect(raw).toMatch(/Settles in \d+\.\d+ seconds/);
});

test("pid demo hydrates cleanly and reacts to input", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/projects/fast-robots");
  const baseline = await overshootOf(page);
  expect(baseline).toBeLessThan(5); // the default is a good tune

  // Windup: with the actuator saturating, dropping anti-windup should make
  // a high Ki overshoot dramatically worse. This is the demo's whole point.
  await page.locator("#pid-ki").fill("20");
  const withAnti = await overshootOf(page);
  await page.locator("#pid-anti").uncheck();
  const withoutAnti = await overshootOf(page);

  expect(withoutAnti).toBeGreaterThan(withAnti * 2);
  expect(withoutAnti).toBeGreaterThan(20);

  // A hydration mismatch would surface here as a console error.
  expect(errors).toEqual([]);
});

test("pid demo shows integral action closing steady-state error", async ({
  page,
}) => {
  await page.goto("/projects/fast-robots");
  const err = async () => {
    const label = await page
      .getByRole("img", { name: /Step response plot/ })
      .getAttribute("aria-label");
    // anchored digits-dot-digits: a greedy [\d.]+ swallows the sentence's
    // full stop and yields NaN
    return Number(/Steady-state error (\d+\.\d+)/.exec(label ?? "")?.[1]);
  };

  // Proportional only: a residual error that more Kp shrinks but never closes.
  await page.locator("#pid-ki").fill("0");
  await page.locator("#pid-kp").fill("2");
  const loose = await err();
  await page.locator("#pid-kp").fill("10");
  const tight = await err();
  expect(loose).toBeGreaterThan(0.1);
  expect(tight).toBeLessThan(loose);
  expect(tight).toBeGreaterThan(0);

  // Integral action closes it — compared at the same Kp as `loose`, since
  // the residual depends on Kp too and a 2 s window is not t → ∞.
  await page.locator("#pid-kp").fill("2");
  await page.locator("#pid-ki").fill("8");
  expect(await err()).toBeLessThan(loose / 20);
});

test("pid demo reset restores the default tune", async ({ page }) => {
  await page.goto("/projects/fast-robots");
  await page.locator("#pid-ki").fill("20");
  await page.locator("#pid-anti").uncheck();
  expect(await overshootOf(page)).toBeGreaterThan(20);

  await page.getByRole("button", { name: "reset" }).click();
  await expect(page.locator("#pid-anti")).toBeChecked();
  expect(await overshootOf(page)).toBeLessThan(5);
});
