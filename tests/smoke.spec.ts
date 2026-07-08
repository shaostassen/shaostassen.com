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
  await page.mouse.wheel(0, 700);
  await expect(header).toHaveClass(/-translate-y-full/);
  await page.mouse.wheel(0, -300);
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

test("styleguide is not exposed in production builds", async ({ page }) => {
  await page.goto("/styleguide");
  await expect(page.getByText(/could not be found/i)).toBeVisible();
  await expect(page.getByText(/color tokens/i)).toHaveCount(0);
});
