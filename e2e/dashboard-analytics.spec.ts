import { mkdir } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

const ADMINISTRATOR = "administrator@example.org";
const PASSWORD = "stub-password";
const STUB = `http://127.0.0.1:${process.env.E2E_STUB_PORT ?? 3703}`;

async function signedIn(page: Page) {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(ADMINISTRATOR);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/);
  await page.goto("/en/insights");
}

test.beforeEach(async ({ page }) => {
  await page.request.post(`${STUB}/__stub/reset`);
});

test("dashboard puts totals before categorized analytics and operations", async ({
  page,
}) => {
  await signedIn(page);
  await page.goto("/en/dashboard");
  await expect(
    page.getByRole("heading", { level: 1, name: "Dashboard" }),
  ).toBeVisible();
  for (const name of [
    "Platform overview",
    "User growth",
    "Applications",
    "Volunteer impact",
    "User signups per day",
    "Volunteer base growth",
    "Applications per day",
    "Confirmed hours per day",
    "Attendance outcomes",
    "Waiting on you",
  ]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  expect(
    await page
      .locator("#overview, #growth, #application-analytics, #impact, #operations")
      .evaluateAll((sections) => sections.map((section) => section.id)),
  ).toEqual(["overview", "growth", "application-analytics", "impact", "operations"]);
});

test("switches between 30 and 90 complete daily buckets and exposes the chart data", async ({
  page,
}) => {
  await signedIn(page);
  await page.goto("/en/dashboard");
  const chart = page
    .locator("section")
    .filter({
      has: page.getByRole("heading", { name: "User signups per day", exact: true }),
    })
    .last();
  await chart.getByText("View daily data", { exact: true }).click();
  await expect(chart.locator("tbody tr")).toHaveCount(30);
  const plot = chart.getByRole("group", { name: "User signups per day", exact: true });
  await plot.focus();
  await plot.press("Home");
  const firstDay = await chart.locator("tbody tr").first().locator("th").innerText();
  await expect(chart.locator('[aria-live="polite"]')).toContainText(firstDay);
  await page.getByRole("link", { name: "Last 90 days", exact: true }).click();
  await expect(page).toHaveURL(/days=90/);
  await expect(
    page.getByRole("link", { name: "Last 90 days", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(chart.locator("tbody tr")).toHaveCount(90);
});

test("keeps dashboard analytics visible when the operational queue fails", async ({
  page,
}) => {
  await signedIn(page);
  await page.request.post(`${STUB}/__stub/break`, {
    data: { path: "/admin/opportunities", status: 503, code: "upstreamUnavailable" },
  });
  await page.goto("/en/dashboard");
  await expect(
    page.getByRole("heading", { name: "User growth", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Platform overview", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-slot="state-panel"]')).toHaveCount(1);
});

test("keeps totals and decisions visible when analytics is unavailable", async ({
  page,
}) => {
  await signedIn(page);
  await page.request.post(`${STUB}/__stub/break`, {
    data: { path: "/admin/analytics", status: 503, code: "upstreamUnavailable" },
  });
  await page.goto("/en/dashboard");
  await expect(
    page.getByRole("heading", { name: "Platform overview", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Waiting on you", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-slot="state-panel"]')).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "User signups per day", exact: true }),
  ).toHaveCount(0);
});

test("renders rates, trends and breakdowns from the admin data", async ({ page }) => {
  await signedIn(page);

  for (const title of [
    "Application pipeline",
    "Applications submitted",
    "Volunteers joining",
    "Applications by status",
    "Vacancies by region",
    "Vacancies by state",
    "Vacancies by format",
  ]) {
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  }

  await expect(page.getByText("Vacancies published", { exact: true })).toBeVisible();
  await expect(page.getByText("Attendance confirmed", { exact: true })).toBeVisible();
});

test("draws a real zero as no bar", async ({ page }) => {
  await signedIn(page);

  const widths = await page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Application pipeline" }) })
    .locator("li > div > div")
    .evaluateAll((bars) => bars.map((bar) => (bar as HTMLElement).style.inlineSize));

  expect(widths).toContain("0%");
});

test("keeps insights useful when one breakdown source fails", async ({ page }) => {
  await signedIn(page);
  await page.request.post(`${STUB}/__stub/break`, {
    data: { path: "/admin/opportunities", status: 503, code: "upstreamUnavailable" },
  });

  await page.goto("/en/insights");

  await expect(
    page.getByRole("heading", { name: "Application pipeline" }),
  ).toBeVisible();
  await expect(page.locator('[data-slot="state-panel"]')).toHaveCount(3);
  const regions = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Vacancies by region" }) });
  await expect(regions).toBeVisible();
  await expect(regions.locator('[data-slot="state-panel"]')).toBeVisible();
});

for (const theme of ["light", "dark"] as const) {
  test(`dashboard stays readable in ${theme} with reduced motion`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await signedIn(page);
    await page.goto("/en/dashboard?days=90");
    await expect(
      page.getByRole("heading", { name: "Attendance outcomes", exact: true }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    if (testInfo.project.name.includes("mobile")) {
      await expect(page.locator('[data-slot="country-ground"] > svg')).toBeHidden();
      await expect(page.locator('[data-slot="country-ground"] > canvas')).toBeHidden();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await mkdir(".impeccable/review", { recursive: true });
    const device = testInfo.project.name.includes("mobile") ? "mobile" : "desktop";
    await page.screenshot({
      path: `.impeccable/review/${device}-${theme}.png`,
      fullPage: true,
      animations: "disabled",
    });
  });
}
