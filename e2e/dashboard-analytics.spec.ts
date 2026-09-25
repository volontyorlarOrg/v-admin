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
