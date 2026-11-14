import { expect, test } from "@playwright/test";

const stub = `http://127.0.0.1:${process.env.E2E_STUB_PORT ?? 3703}`;

test.beforeEach(async ({ page }) => {
  await page.request.post(`${stub}/__stub/reset`);
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("administrator@example.org");
  await page.getByLabel("Password", { exact: true }).fill("stub-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/);
});

test("data requests are a section of their own, with who sent each one and its deadline", async ({
  page,
}) => {
  const menu = page.getByRole("button", { name: "Open the menu" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("link", { name: "Data requests" }).first().click();
  await expect(page).toHaveURL(/\/en\/legal$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Data requests");
  await expect(page.getByText("Please send me a copy of my data.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Dilnoza Karimova" })).toBeVisible();
  await expect(page.getByText("Answer within 10 days (Article 22).")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
});

test("an answer must say what was done before the request leaves the queue", async ({
  page,
}) => {
  await page.goto("/en/legal");
  await page.getByRole("button", { name: "Record answer" }).click();
  const answer = page.getByLabel("What was done");
  await expect(answer).toBeVisible();
  await answer.fill("Sent a copy of the account, profile and applications by email.");
  await page.getByRole("button", { name: "Save answer" }).click();
  await expect(page.getByText("No open requests")).toBeVisible();
});
