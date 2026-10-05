import { expect, test, type Page } from "@playwright/test";

const stub = `http://127.0.0.1:${process.env.E2E_STUB_PORT ?? 3703}`;
const firstTestVolunteer = "00000000-0000-4000-9000-000000000001";

test.beforeEach(async ({ page }) => {
  await page.request.post(`${stub}/__stub/reset`);
  await page.request.post(`${stub}/__stub/bulk-users`);
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("administrator@example.org");
  await page.getByLabel("Password", { exact: true }).fill("stub-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/);
  await page.goto("/en/bulk-awards", { waitUntil: "networkidle" });
});

async function describeAward(page: Page, values: { xp?: string; hours?: string }) {
  if (values.xp) await page.getByLabel("XP", { exact: true }).fill(values.xp);
  if (values.hours) await page.getByLabel("Hours", { exact: true }).fill(values.hours);
  await page.getByLabel("Reason", { exact: true }).fill("Navruz festival");
}

async function giveAward(page: Page) {
  await page.getByRole("button", { name: "Review award", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Give this award?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Give award", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Award given" })).toBeVisible();
}

test("keeps chosen volunteers across pages and searches, then applies the award at once", async ({
  page,
}) => {
  await page.getByRole("checkbox", { name: "Everyone on this page" }).check();
  await expect(page.getByText("Chosen: 25", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByText("Chosen: 25", { exact: true })).toBeVisible();
  await page.getByRole("checkbox", { name: "Test volunteer 29" }).check();
  await expect(page.getByText("Chosen: 26", { exact: true })).toBeVisible();

  await page.getByRole("searchbox").fill("Test volunteer 00");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=Test/);
  await expect(page.getByText("Chosen: 26", { exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Test volunteer 00" })).toBeChecked();

  await describeAward(page, { xp: "25", hours: "1.5" });
  await expect(page.getByText("+650 XP · +39 h", { exact: true })).toBeVisible();
  await giveAward(page);

  await expect(page.getByText("Navruz festival").first()).toBeVisible();
  await page.getByRole("link", { name: "Open the award", exact: true }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Navruz festival" }),
  ).toBeVisible();
  const recipients = page.getByRole("region", { name: "Who received it" });
  await expect(recipients).toContainText("26");
  await recipients.getByRole("searchbox").fill("29");
  await recipients.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    recipients.getByRole("link", { name: /Test volunteer 29/ }),
  ).toBeVisible();
});

test("gives everyone an award, shows it on a volunteer's record, and takes it back", async ({
  page,
}) => {
  await page.getByRole("radio", { name: /^Everyone/ }).check({ force: true });
  await expect(page.getByText(/^Active volunteers: \d+$/)).toBeVisible();
  await describeAward(page, { hours: "2" });
  await giveAward(page);

  await page.goto(`/en/users/${firstTestVolunteer}`);
  await page.getByRole("link", { name: "Bulk award", exact: true }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Navruz festival" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Take back award", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Take back this award?" });
  await dialog.getByRole("button", { name: "Take it back", exact: true }).click();
  await expect(page.getByText("Taken back", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Take back award" })).toHaveCount(0);

  await page.goto(`/en/users/${firstTestVolunteer}`);
  await expect(page.getByRole("link", { name: "Bulk award", exact: true })).toHaveCount(
    0,
  );
});

test("says what is missing before anything can be given", async ({ page }) => {
  await page.getByRole("button", { name: "Review award", exact: true }).click();
  await expect(page.getByText("Enter XP, hours or both.")).toBeVisible();
  await expect(page.getByText("Write a reason.")).toBeVisible();
  await expect(
    page.getByText("Choose at least one volunteer, or switch to Everyone."),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("fits the viewport in light and dark themes with reduced motion", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await expect(
    page.getByRole("heading", { name: "Bulk awards", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("bulk-awards-light.png"),
    fullPage: true,
  });
  await page.evaluate(() =>
    document.documentElement.setAttribute("data-theme", "dark"),
  );
  await page.screenshot({
    path: testInfo.outputPath("bulk-awards-dark.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
