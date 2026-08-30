import { test, expect } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/** Projects marked `caseStudy: false` — listed, but with no write-up. */
function listingOnly(): { slug: string; title: string }[] {
  const dir = path.join(process.cwd(), "src/content/projects");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => ({
      slug: f.replace(/\.mdx$/, ""),
      src: readFileSync(path.join(dir, f), "utf8"),
    }))
    .filter((p) => /^caseStudy:\s*false\s*$/m.test(p.src))
    .map((p) => ({
      slug: p.slug,
      title: (p.src.match(/^title:\s*"?(.+?)"?\s*$/m)?.[1] ?? p.slug).trim(),
    }));
}

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
  // Data-driven rather than naming a project: SpeechLens used to be the
  // example and stopped being one when its case study landed. Skips when
  // nothing is caseStudy:false, and re-arms the moment something is.
  const projects = listingOnly();
  test.skip(projects.length === 0, "no caseStudy:false projects right now");

  await page.goto("/projects");
  const sitemap = await (await page.request.get("/sitemap.xml")).text();

  for (const { slug, title } of projects) {
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByRole("link", { name: title })).toHaveCount(0);

    const res = await page.request.get(`/projects/${slug}`, {
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(404);
    expect(sitemap).not.toContain(`/projects/${slug}`);
  }
});

test("nav hides on scroll down and reveals on scroll up", async ({ page }) => {
  await page.goto("/");
  const room = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  test.skip(room < 300, "page not scrollable enough at this viewport");

  // By role, not by tag: PageHeader also renders a <header>, but nested
  // inside a <section>/<main> it is generic — only the sticky site nav is
  // the banner landmark.
  const header = page.getByRole("banner");
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

  // The edge state, now reachable per-track rather than page-wide: every
  // category has at least one project since S12.1, but Embedded exists only
  // under Individual work, so School work still renders the empty state.
  await page.getByRole("button", { name: "Embedded" }).click();
  const embedded = await cards.count();
  expect(embedded).toBeGreaterThan(0);
  expect(embedded).toBeLessThan(total);
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
  // The other systems project. Matched on a stable word rather than its full
  // title: it was renamed once already, when the page was rewritten to describe
  // the infrastructure that exists instead of the edge pipeline that was only
  // ever intended.
  await expect(
    page.getByRole("heading", { level: 3, name: /Tailscale/ }),
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
    page.getByRole("heading", { name: "Remote ML Compute over Tailscale" }),
  ).toBeVisible();
  // the individual track no longer shows the empty state
  await expect(page.getByText("write-ups in progress")).toHaveCount(0);

  await page.goto("/projects/parallel-spgemm");
  const moreNav = page.getByRole("navigation", { name: "More projects" });
  await expect(moreNav.getByRole("link")).toHaveCount(2);
  // Behavioural, not inventory: neighbours shift whenever a project is
  // inserted into the ordering, so follow the forward link rather than
  // naming whichever project currently sits there.
  await moreNav.getByRole("link").last().click();
  await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
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

test("high-school project ships its demo video without preloading it", async ({
  page,
}) => {
  await page.goto("/projects/super-gold-hunters");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Super Gold Hunters",
  );

  // 2.6 MB must not be on the critical path — it downloads only on play.
  const video = page.locator("video");
  await expect(video).toHaveAttribute("preload", "none");
  await expect(video).toHaveAttribute("controls", "");
  await expect(video).toHaveAttribute(
    "poster",
    "/projects/super-gold-hunters/screenshot.png",
  );

  // both media files actually exist at the paths the markup claims
  for (const asset of ["gameplay.mp4", "screenshot.png"]) {
    const res = await page.request.get(`/projects/super-gold-hunters/${asset}`);
    expect(res.status(), asset).toBe(200);
  }

  // credit is part of the content, not decoration
  await expect(page.getByRole("link", { name: "Jude Ramanan" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Rishwanth Vidhya" }),
  ).toBeVisible();
});

test("the combat-robotics bout ships its clip without preloading it", async ({
  page,
}) => {
  await page.goto("/projects/blaze-and-heat");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Blaze and Heat",
  );

  // 1.8 MB stays off the critical path — it downloads only on play.
  const video = page.locator("video");
  await expect(video).toHaveAttribute("preload", "none");
  await expect(video).toHaveAttribute("controls", "");
  // WebP, not PNG like super-gold-hunters: this poster is a 3D render, and
  // PNG costs 147 kB against WebP's 16 kB for the same frame.
  await expect(video).toHaveAttribute(
    "poster",
    "/projects/blaze-and-heat/screenshot.webp",
  );

  // the clip is silent, so the caption is the only description of it — and
  // aria-describedby is what ties the two together for a screen reader
  await expect(video).toHaveAttribute("aria-describedby", "bout-desc");
  await expect(page.locator("#bout-desc")).toBeVisible();

  for (const asset of ["gameplay.mp4", "screenshot.webp"]) {
    const res = await page.request.get(`/projects/blaze-and-heat/${asset}`);
    expect(res.status(), asset).toBe(200);
  }
});

test("the new graphics category filters on the projects index", async ({
  page,
}) => {
  await page.goto("/projects?category=graphics");
  await expect(page.getByRole("button", { name: "Graphics" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    page.getByRole("heading", { level: 3, name: "Super Gold Hunters" }),
  ).toBeVisible();
  // it is school work, so it must land in that group
  await expect(
    page.getByRole("heading", { name: "School work" }),
  ).toBeVisible();
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

test("the electrons case study links to the instrument", async ({ page }) => {
  await page.goto("/projects/electrons");
  await page
    .getByRole("link", { name: /open the instrument/i })
    .first()
    .click();
  // Not anchored with $: the instrument writes ?level= on arrival, which is
  // the deep-link feature working, not a stray redirect.
  await expect(page).toHaveURL(/\/projects\/electrons\/lab(\?|$)/);
  await expect(
    page.getByRole("heading", { level: 1, name: /Electrons/ }),
  ).toBeVisible();
});

test("the instrument walks the whole ladder", async ({ page }) => {
  await page.goto("/projects/electrons/lab");
  const levels = page.getByRole("navigation", { name: "Ladder levels" });

  // Level 01 is where it opens, and the ladder ends on the memory coda.
  await expect(levels.getByRole("button", { name: /SIGNAL/ })).toBeVisible();
  await levels.getByRole("button", { name: /MEMORY/ }).click();
  await expect(page.getByText("6T SRAM cell", { exact: false })).toBeVisible();

  // Level 10 closes the loop back onto level 01 — the thesis of the piece,
  // so it is pinned rather than trusted.
  await levels.getByRole("button", { name: /PROGRAM/ }).click();
  await expect(
    page.getByText("this is level 01 again", { exact: false }),
  ).toBeVisible();
});

test("the instrument keeps the host page's landmarks intact", async ({
  page,
}) => {
  await page.goto("/projects/electrons/lab");
  // chrome={false} must not introduce a second <main> or a second <h1>.
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveCount(1);
});

test("a level can be linked directly", async ({ page }) => {
  // The whole point of ?level= is that someone lands on that rung, not on 01.
  await page.goto("/projects/electrons/lab?level=07");
  await expect(page.getByText("flip-flop capture window")).toBeVisible();

  // The slug is accepted too, and the URL is normalised to the padded number
  // so a shared link looks deliberate.
  await page.goto("/projects/electrons/lab?level=memory");
  await expect(page.getByText("6T SRAM cell", { exact: false })).toBeVisible();
  await expect(page).toHaveURL(/level=11/);
});

test("moving through the ladder keeps the deep link in step", async ({
  page,
}) => {
  await page.goto("/projects/electrons/lab");
  await expect(page).toHaveURL(/level=01/);
  await page
    .getByRole("navigation", { name: "Ladder levels" })
    .getByRole("button", { name: /DATAPATH/ })
    .click();
  await expect(page).toHaveURL(/level=09/);
  // replaceState, not pushState: one level must not become one history entry.
  await page.goBack();
  await expect(page).not.toHaveURL(/\/projects\/electrons\/lab/);
});

test("the guided tour starts on request and stops on demand", async ({
  page,
}) => {
  await page.goto("/projects/electrons/lab");
  // Idle until asked — nothing autoplays.
  await expect(page.getByRole("button", { name: /guided tour/ })).toBeVisible();
  await expect(page.getByText(/step 1 of/)).toHaveCount(0);

  await page.getByRole("button", { name: /guided tour/ }).click();
  await expect(page.getByText(/step 1 of 11/)).toBeVisible();

  await page.getByRole("button", { name: /stop tour/ }).click();
  await expect(page.getByRole("button", { name: /guided tour/ })).toBeVisible();
});

test("the demostack cockpit clip ships without preloading it", async ({
  page,
}) => {
  await page.goto("/projects/demostack");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Local-First Imitation-Learning Platform",
  );

  // 353 kB stays off the critical path — it downloads only on play.
  const video = page.locator("video");
  await expect(video).toHaveAttribute("preload", "none");
  await expect(video).toHaveAttribute("controls", "");
  // JPEG, not PNG/WebP: the poster is a screenshot of a dark UI with a
  // photographic sim render in it, and JPEG costs 44 kB for that frame.
  await expect(video).toHaveAttribute(
    "poster",
    "/projects/demostack/poster.jpg",
  );

  // both media files exist at the paths the markup claims
  for (const asset of ["loop.mp4", "poster.jpg"]) {
    const res = await page.request.get(`/projects/demostack/${asset}`);
    expect(res.status(), asset).toBe(200);
  }

  // the caption is the accessible description, so it must be wired up
  await expect(video).toHaveAttribute("aria-describedby", "loop-desc");
  await expect(page.locator("#loop-desc")).toContainText("autopilot on");
});

test("the bits case study links to its instrument", async ({ page }) => {
  await page.goto("/projects/bits-to-messages");
  await page
    .getByRole("link", { name: /open the instrument/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/projects\/bits-to-messages\/lab$/);
  await expect(
    page.getByRole("heading", { level: 1, name: /Bits/ }),
  ).toBeVisible();
});

test("the bits instrument keeps the host page's landmarks intact", async ({
  page,
}) => {
  await page.goto("/projects/bits-to-messages/lab");
  // chrome={false} must not introduce a second <main> or a second <h1>.
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveCount(1);
});

test("the bits instrument is fully rendered in the export, before any JS runs", async ({
  browser,
}) => {
  // Level 01 is the deterministic initial render, so the whole first rung
  // belongs in the HTML. A teaching page that shows a blank box without
  // JavaScript teaches nothing.
  const page = await browser.newPage({ javaScriptEnabled: false });
  await page.goto("/projects/bits-to-messages/lab");
  await expect(page.getByRole("img", { name: "line trace" })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Ladder levels" }),
  ).toBeVisible();
  // 0x41 0x69 is level 01's payload, decoded cleanly.
  await expect(page.getByText("41", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("69", { exact: true }).first()).toBeVisible();
  await page.close();
});

test("the bits ladder walks all eleven rungs and closes", async ({ page }) => {
  await page.goto("/projects/bits-to-messages/lab");
  const ladder = page.getByRole("navigation", { name: "Ladder levels" });

  await expect(ladder.getByRole("button", { name: /01 LINE/ })).toBeVisible();
  await ladder.getByRole("button", { name: /06 FIFO/ }).click();
  await expect(page.getByRole("heading", { name: /06 — FIFO/ })).toBeVisible();

  // All eleven rungs, and the coda closes it rather than trailing off.
  await ladder.getByRole("button", { name: /11 BUS/ }).click();
  await expect(page.getByRole("heading", { name: /11 — BUS/ })).toBeVisible();
  await expect(page.getByText(/All 11 rungs are drawn/)).toBeVisible();
});

test("a bits level can be linked directly, by number or by name", async ({
  page,
}) => {
  await page.goto("/projects/bits-to-messages/lab?level=05");
  await expect(
    page.getByRole("heading", { name: /05 — ERRORS/ }),
  ).toBeVisible();

  await page.goto("/projects/bits-to-messages/lab?level=flow");
  await expect(page.getByRole("heading", { name: /07 — FLOW/ })).toBeVisible();
});

test("detuning the receiver past its budget breaks the link", async ({
  page,
}) => {
  await page.goto("/projects/bits-to-messages/lab?level=04");
  const slider = page.getByRole("slider", { name: /receiver rate error/i });

  // Assert on the decoded bytes, not on prose: the level's own "break it:"
  // header carries the phrase "outside the budget" at all times, so matching
  // text here would have passed for the wrong reason.
  await expect(page.getByTitle("framing", { exact: false })).toHaveCount(0);

  // The budget for 8N1 is +3.90% / −4.64%; 6.4% is past it. This is the whole
  // claim of level 04, so it is pinned rather than trusted.
  await slider.fill("6.4");
  await expect(
    page.getByTitle("framing", { exact: false }).first(),
  ).toBeVisible();

  // And it comes back: the failure is a property of the rate, not a latch.
  await slider.fill("0");
  await expect(page.getByTitle("framing", { exact: false })).toHaveCount(0);
});

test("two flipped bits pass parity undetected", async ({ page }) => {
  // Level 05's whole point: parity reports whether the count of ones is odd,
  // so an even number of errors cancels and the wrong byte is delivered clean.
  await page.goto("/projects/bits-to-messages/lab?level=05");
  const flips = page.getByLabel("flip data bits");

  await flips.selectOption("1");
  await expect(page.getByTitle("parity").first()).toBeVisible();

  await flips.selectOption("2");
  await expect(page.getByTitle("parity")).toHaveCount(0);
  await expect(page.getByTitle("wrong, undetected").first()).toBeVisible();

  // Odd again, and parity catches it again.
  await flips.selectOption("3");
  await expect(page.getByTitle("parity").first()).toBeVisible();
});

test("a slow service routine loses bytes off a perfect wire", async ({
  page,
}) => {
  await page.goto("/projects/bits-to-messages/lab?level=06");
  const latency = page.getByRole("slider", {
    name: /service routine latency/i,
  });

  await latency.fill("0");
  await expect(page.getByText(/nothing is lost/)).toBeVisible();

  // Past the latency budget the FIFO overruns, and the loss leaves no trace
  // on the wire at all.
  await latency.fill("510");
  await expect(page.getByText(/bytes are gone/)).toBeVisible();
});

test("in-band flow control eats bytes out of a binary payload", async ({
  page,
}) => {
  await page.goto("/projects/bits-to-messages/lab?level=07");
  await expect(page.getByText(/transparent here/)).toBeVisible();

  // The payload contains 0x11 and 0x13 as data, which XON/XOFF consumes as
  // commands. Three of ten bytes never reach the application.
  await page.getByLabel("what you are sending").selectOption("binary");
  await expect(
    page.getByText(/bytes of your firmware image are gone/),
  ).toBeVisible();

  // Two wires instead of two byte values, and the payload survives.
  await page.getByLabel("flow control").selectOption("rtscts");
  await expect(
    page.getByText(/binary payloads pass through untouched/),
  ).toBeVisible();
});

test("the bits instrument is keyboard operable", async ({ page }) => {
  await page.goto("/projects/bits-to-messages/lab?level=04");
  const slider = page.getByRole("slider", { name: /receiver rate error/i });
  await slider.focus();
  await expect(slider).toBeFocused();
  const before = await slider.inputValue();
  await page.keyboard.press("ArrowRight");
  expect(Number(await slider.inputValue())).toBeGreaterThan(Number(before));
});

test("joining a stream mid-flight costs exactly one message", async ({
  page,
}) => {
  await page.goto("/projects/bits-to-messages/lab?level=08");

  // Chunking is the transport's business, not the protocol's: a frame split
  // across four reads and a frame delivered whole decode the same.
  const chunk = page.getByRole("slider", { name: /read chunk size/i });
  await chunk.fill("1");
  await expect(page.getByText(/^delivered — LED ON$/)).toBeVisible();
  await chunk.fill("40");
  await expect(page.getByText(/^delivered — LED ON$/)).toBeVisible();

  // A listener that opens the port late loses the frame it lands in, and
  // exactly that one — the bound is the reason to use a self-delimiting frame.
  await page.getByLabel("the listener").selectOption("midstream");
  await expect(page.getByText(/discarded \(cobs\)/)).toBeVisible();
  await expect(page.getByText(/^delivered — READ:TEMP\?$/)).toBeVisible();
  await expect(page.getByText(/^delivered — \*IDN\?$/)).toBeVisible();
});

test("an xor checksum passes damage a CRC catches", async ({ page }) => {
  await page.goto("/projects/bits-to-messages/lab?level=09");
  const damage = page.getByLabel("corruption");

  // One flipped bit is caught by everything, which is why testing against one
  // flipped bit proves nothing.
  await damage.selectOption("one");
  await expect(page.getByText(/passes: damage undetected/)).toHaveCount(0);

  // Two errors in the same bit column cancel in the XOR exactly.
  await damage.selectOption("column");
  await expect(page.getByText(/passes: damage undetected/)).toHaveCount(1);

  // Neither XOR nor a sum depends on order, so a byte swap defeats both.
  await damage.selectOption("swap");
  await expect(page.getByText(/passes: damage undetected/)).toHaveCount(2);
});

test("a lost ACK delivers the message twice when nobody checks sequence", async ({
  page,
}) => {
  // The failure the whole ladder climbs towards: both frames intact, both CRCs
  // valid, no flag raised anywhere, and the valve opened twice.
  await page.goto("/projects/bits-to-messages/lab?level=10");
  await expect(page.getByText(/One send, one ACK, one delivery/)).toBeVisible();

  await page.getByLabel("drop").selectOption("ack");
  await expect(page.getByText(/duplicate recognised by seq/)).toBeVisible();
  await expect(page.getByText(/valve was opened twice/)).toHaveCount(0);

  await page
    .getByRole("checkbox", { name: /check sequence numbers/i })
    .uncheck();
  await expect(page.getByText(/valve was opened twice/)).toBeVisible();
});

test("a driver released late fights the next talker for the bus", async ({
  page,
}) => {
  await page.goto("/projects/bits-to-messages/lab?level=11");
  const release = page.getByRole("slider", { name: /driver release delay/i });

  // Ten bit times of quiet between talkers, so anything up to that is clean.
  await release.fill("10");
  await expect(page.getByText(/One driver at a time/)).toBeVisible();

  // Past it, two output stages drive one pair. No hardware flag reports this.
  await release.fill("16");
  await expect(
    page.getByText(/two output stages are driving one pair/),
  ).toBeVisible();
});

test("the LIVE panel explains itself and never connects on its own", async ({
  page,
}) => {
  // A page that opens a socket the moment it loads is doing something the
  // reader did not ask for — and on this static host there is no server to
  // reach, so it would only ever log a failed connection. The gate forbids
  // console errors, and this is what keeps that true.
  const consoleErrors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => consoleErrors.push(e.message));

  const sockets: string[] = [];
  page.on("websocket", (ws) => sockets.push(ws.url()));

  await page.goto("/projects/bits-to-messages/lab?level=live");
  await expect(
    page.getByRole("heading", { name: /LIVE — a real port/ }),
  ).toBeVisible();
  await expect(page.getByText(/Nothing is connected/)).toBeVisible();
  await expect(page.getByRole("button", { name: "connect" })).toBeVisible();

  await page.waitForTimeout(500);
  expect(sockets).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("the modes sit beside the ladder rather than extending it", async ({
  page,
}) => {
  await page.goto("/projects/bits-to-messages/lab");
  const ladder = page.getByRole("navigation", { name: "Ladder levels" });

  // Eleven *numbered* rungs is the invariant; the modes are not rungs, and the
  // closing note has to keep saying eleven however many modes get added.
  const numbered = ladder.getByRole("button", { name: /^\d\d / });
  await expect(numbered).toHaveCount(11);
  await expect(page.getByText(/All 11 rungs are drawn/)).toBeVisible();

  await expect(ladder.getByRole("button", { name: "JOURNEY" })).toBeVisible();
  await expect(ladder.getByRole("button", { name: "LIVE" })).toBeVisible();
});

test("JOURNEY carries one message across every protocol", async ({ page }) => {
  await page.goto("/projects/bits-to-messages/lab?level=journey");
  await expect(
    page.getByRole("heading", {
      name: /JOURNEY — one message, three protocols/,
    }),
  ).toBeVisible();

  const protocol = page.getByLabel("protocol");
  const message = page.getByLabel("message to send");
  await message.fill("Hi!");

  // UART: one wire, and the receiver has to infer when to look.
  await expect(page.getByText("inferred")).toBeVisible();
  await expect(page.getByText(/Arrived intact/)).toBeVisible();

  // SPI: four wires, and the clock arrives on one of them.
  await protocol.selectOption("spi");
  await expect(page.getByText("on its own wire").first()).toBeVisible();
  await expect(page.getByText(/Arrived intact/)).toBeVisible();

  // I2C: two wires again, but now with addressing on a shared bus.
  await protocol.selectOption("i2c");
  await expect(page.getByText("112 usable")).toBeVisible();
  await expect(page.getByText(/Arrived intact/)).toBeVisible();

  // CAN, 1-Wire, Manchester and USB all carry the same message too.
  for (const p of ["can", "onewire", "manchester", "usb"]) {
    await protocol.selectOption(p);
    await expect(page.getByText(/Arrived intact/)).toBeVisible();
  }
});

test("RS-485 rejects the noise that destroys RS-232", async ({ page }) => {
  // The best comparison in the whole instrument: identical disturbance, and the
  // only thing that differs is how the receiver decides.
  await page.goto("/projects/bits-to-messages/lab?level=journey");
  const protocol = page.getByLabel("protocol");
  const breakIt = page.getByLabel("break it");

  await protocol.selectOption("rs232");
  await expect(page.getByText(/Arrived intact/)).toBeVisible();

  // Four volts against a 2.5 V margin, on one wire referenced to ground.
  await breakIt.selectOption("4");
  await expect(page.getByText(/pushed the wire across/)).toBeVisible();

  // The same four volts, now landing on both wires of a pair.
  await protocol.selectOption("rs485");
  await expect(page.getByText(/not one bit changed/)).toBeVisible();
  await expect(page.getByText(/Arrived intact/)).toBeVisible();

  // Differential is not magic: the input stage still has a range.
  await breakIt.selectOption("40");
  await expect(page.getByText(/outside the -7 V to \+12 V/)).toBeVisible();
});

test("USB times out rather than colliding when nobody answers", async ({
  page,
}) => {
  await page.goto("/projects/bits-to-messages/lab?level=journey");
  await page.getByLabel("protocol").selectOption("usb");
  await expect(page.getByText(/spoke only in the last one/)).toBeVisible();

  await page.getByLabel("break it").selectOption("absent");
  await expect(page.getByText(/the host had not asked it/)).toBeVisible();
});

test("each protocol fails in its own characteristic way", async ({ page }) => {
  await page.goto("/projects/bits-to-messages/lab?level=journey");
  const protocol = page.getByLabel("protocol");
  const breakIt = page.getByLabel("break it");

  // UART just past budget: the stop bit lands wrong while the data survives —
  // you lose your reason to believe the bytes before you lose the bytes.
  await breakIt.selectOption("6.4");
  await expect(page.getByText(/That is a framing error/)).toBeVisible();
  await expect(page.getByText(/the values are still correct/)).toBeVisible();
  await breakIt.selectOption("14");
  await expect(page.getByText(/the bytes are wrong/)).toBeVisible();

  // SPI mode mismatch: wrong bytes, and nothing anywhere to report it.
  await protocol.selectOption("spi");
  await breakIt.selectOption("1");
  await expect(
    page.getByText(/SPI has no error detection of any kind/),
  ).toBeVisible();
  // CPOL alone only renames the edges, so modes 0 and 2 still interoperate.
  await breakIt.selectOption("2");
  await expect(page.getByText(/Arrived intact/)).toBeVisible();

  // I2C: the ninth clock is what makes "nobody is there" detectable at all.
  await protocol.selectOption("i2c");
  await breakIt.selectOption("0x18");
  await expect(
    page.getByText(/Nothing acknowledged the address/),
  ).toBeVisible();
});
