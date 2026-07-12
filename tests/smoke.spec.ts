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
    page.getByRole("heading", { name: "Selected work" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 3 })).toHaveCount(4);
  await expect(page.getByText("~21× on 32 cores")).toBeVisible();
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

test("unknown routes return the 404 page", async ({ page }) => {
  const response = await page.goto("/definitely-not-a-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByText(/could not be found/i)).toBeVisible();
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
  await expect(page.getByRole("contentinfo")).toContainText("Built with");
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
  await expect(page.getByRole("heading", { level: 3 })).toHaveCount(3);

  // filter to Robotics: only Fast Robots remains
  await page.getByRole("button", { name: "Robotics" }).click();
  await expect(page.getByRole("button", { name: "Robotics" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("heading", { level: 3 })).toHaveCount(1);
  await expect(page).toHaveURL(/category=robotics/);

  // empty category shows the edge state in both track sections
  await page.getByRole("button", { name: "Embedded" }).click();
  await expect(page.getByText("no projects in this category yet")).toHaveCount(
    2,
  );
});

test("projects filter deep-links via URL", async ({ page }) => {
  await page.goto("/projects?category=systems-hpc");
  await expect(
    page.getByRole("button", { name: "Systems · HPC" }),
  ).toHaveAttribute("aria-pressed", "true");
  // one systems-hpc project per track
  await expect(page.getByRole("heading", { level: 3 })).toHaveCount(2);
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
  await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible();
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

test("styleguide is not exposed in production builds", async ({ page }) => {
  await page.goto("/styleguide");
  await expect(page.getByText(/could not be found/i)).toBeVisible();
  await expect(page.getByText(/color tokens/i)).toHaveCount(0);
});
