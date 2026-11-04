import { expect, test } from "@playwright/test";
const stub = `http://127.0.0.1:${process.env.E2E_STUB_PORT ?? 3703}`;
test.beforeEach(async ({ page }) => {
  await page.request.post(`${stub}/__stub/reset`);
  await page.request.post(`${stub}/__stub/reports`);
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("administrator@example.org");
  await page.getByLabel("Password", { exact: true }).fill("stub-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/);
  await page.goto("/en/reports");
});
test("reads the report, resolves it and reopens it through the admin queue", async ({
  page,
}) => {
  await page
    .getByRole("link", { name: /The profile save button does not finish/ })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Report details" }),
  ).toBeVisible();
  await expect(page.getByText("/profile/edit", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mark resolved" }).click();
  await expect(page.getByRole("button", { name: "Reopen report" })).toBeVisible();
  await page.goto("/en/reports");
  await expect(page.getByText("No open reports", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Resolved", exact: true }).click();
  await expect(
    page.getByRole("link", { name: /The profile save button does not finish/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reopen report" }).click();
  await page.getByRole("link", { name: "Open", exact: true }).click();
  await expect(page.getByRole("button", { name: "Mark resolved" })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
});
test("explains stale updates instead of overwriting another administrator", async ({
  page,
}) => {
  await page.request.post(`${stub}/__stub/report-version`);
  await page.getByRole("button", { name: "Mark resolved" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Another administrator" }),
  ).toContainText("Another administrator changed this report");
});
test("shows a failed read without presenting it as an empty queue", async ({
  page,
}) => {
  await page.request.post(`${stub}/__stub/break`, {
    data: { path: "/admin/reports", status: 503, code: "server" },
  });
  await page.reload();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.getByText("No open reports", { exact: true })).toHaveCount(0);
});
