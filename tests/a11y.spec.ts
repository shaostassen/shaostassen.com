import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = [
  "/",
  "/about",
  "/projects",
  "/projects/fast-robots",
  "/projects/parallel-spgemm",
  "/projects/ml-workstation-edge-pipeline",
  "/coursework",
  "/contact",
  "/definitely-not-a-page", // 404 boundary
];

const themes = ["light", "dark"] as const;

for (const theme of themes) {
  for (const path of pages) {
    test(`axe (WCAG 2.1 AA): ${path} [${theme}]`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(path);
      // let entrance animations settle — axe measures blended mid-fade
      // colors otherwise
      await page.evaluate(() =>
        Promise.all(document.getAnimations().map((a) => a.finished)),
      );
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(
        results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => n.html).slice(0, 3),
        })),
      ).toEqual([]);
    });
  }
}

test("axe: projects page with open mobile menu", async ({ page }) => {
  await page.goto("/projects");
  const menuButton = page.getByRole("button", { name: "Menu" });
  test.skip(!(await menuButton.isVisible()), "desktop viewport");
  await menuButton.click();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("reduced motion: animated content is immediately visible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const tagline = page.getByText(/I work where software meets hardware/);
  await expect(tagline).toBeVisible();
  const opacity = await tagline.evaluate((el) => getComputedStyle(el).opacity);
  expect(opacity).toBe("1");
});

test("mobile menu closes on Escape and returns focus", async ({ page }) => {
  await page.goto("/");
  const menuButton = page.getByRole("button", { name: "Menu" });
  test.skip(!(await menuButton.isVisible()), "desktop viewport");
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  await expect(menuButton).toBeFocused();
});
