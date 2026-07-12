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
  await expect(page.getByText("write-ups in progress")).toBeVisible();
  await expect(page.getByRole("heading", { level: 3 })).toHaveCount(2);

  // filter to Robotics: SpGEMM disappears, Fast Robots stays
  await page.getByRole("button", { name: "Robotics" }).click();
  await expect(page.getByRole("button", { name: "Robotics" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("heading", { level: 3 })).toHaveCount(1);
  await expect(page).toHaveURL(/category=robotics/);

  // empty category shows the edge state
  await page.getByRole("button", { name: "Embedded" }).click();
  await expect(
    page.getByText("no projects in this category yet"),
  ).toBeVisible();
});

test("projects filter deep-links via URL", async ({ page }) => {
  await page.goto("/projects?category=systems-hpc");
  await expect(
    page.getByRole("button", { name: "Systems · HPC" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { level: 3 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 3 })).toContainText(
    "Sparse Matrix",
  );
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

test("nav links to about", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Site" })
    .getByRole("link", { name: "About" })
    .click();
  await expect(page).toHaveURL(/\/about/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("About");
});

test("styleguide is not exposed in production builds", async ({ page }) => {
  await page.goto("/styleguide");
  await expect(page.getByText(/could not be found/i)).toBeVisible();
  await expect(page.getByText(/color tokens/i)).toHaveCount(0);
});
