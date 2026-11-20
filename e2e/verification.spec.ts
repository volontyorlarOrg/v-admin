import { expect, test } from "@playwright/test";

test("an administrator assigns and revokes a volunteer's marks on their record", async ({
  page,
}) => {
  const stub = `http://127.0.0.1:${process.env.E2E_STUB_PORT ?? 3703}`;
  await page.request.post(`${stub}/__stub/reset`);
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("administrator@example.org");
  await page.getByLabel("Password", { exact: true }).fill("stub-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/);
  await page.goto("/en/users?q=dilnoza");
  await page.getByRole("link", { name: "Dilnoza Karimova" }).first().click();
  await expect(page.getByLabel("Organization affiliation")).toBeDisabled();
  await page.getByLabel("Verified badge").check();
  await page
    .getByLabel("Organization affiliation")
    .selectOption({ label: "Chilonzor Reading Corners" });
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Verification updated.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Verified badge")).toBeChecked();
  await expect(page.getByLabel("Organization affiliation")).toHaveValue(
    "00000000-0000-4000-8000-000000000301",
  );
  await page.getByLabel("Verified badge").uncheck();
  await expect(page.getByLabel("Organization affiliation")).toBeDisabled();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Verification updated.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Verified badge")).not.toBeChecked();
  await expect(page.getByLabel("Organization affiliation")).toHaveValue("");
});

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAfbLI3wAAAABJRU5ErkJggg==",
  "base64",
);

test("an administrator uploads a custom badge from their device and removes it", async ({
  page,
}, testInfo) => {
  const stub = `http://127.0.0.1:${process.env.E2E_STUB_PORT ?? 3703}`;
  await page.request.post(`${stub}/__stub/reset`);
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("administrator@example.org");
  await page.getByLabel("Password", { exact: true }).fill("stub-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/);
  await page.goto("/en/users?q=dilnoza");
  await page.getByRole("link", { name: "Dilnoza Karimova" }).first().click();

  const upload = page.getByRole("button", { name: "Upload badge" });
  const file = page.getByLabel("Badge image");
  await expect(page.getByRole("button", { name: "Remove badge" })).toHaveCount(0);

  await file.setInputFiles({
    name: "badge.gif",
    mimeType: "image/gif",
    buffer: Buffer.from("GIF89a"),
  });
  await expect(page.getByText("Choose a JPEG, PNG or WebP image.")).toBeVisible();
  await expect(upload).toBeDisabled();

  await file.setInputFiles({ name: "badge.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByText("Choose a JPEG, PNG or WebP image.")).toHaveCount(0);
  await expect(upload).toBeEnabled();
  await upload.click();
  await expect(page.getByText("Badge saved.")).toBeVisible();
  await expect(page.getByRole("img", { name: "Current custom badge" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove badge" })).toBeVisible();
  await page.locator("#verification").screenshot({
    path: testInfo.outputPath("custom-badge.png"),
  });

  await expect(page.getByLabel("Verified badge")).not.toBeChecked();
  await page.reload();
  await expect(page.getByRole("img", { name: "Current custom badge" })).toBeVisible();

  await page.getByRole("button", { name: "Remove badge" }).click();
  await expect(page.getByText("Badge removed.")).toBeVisible();
  await expect(page.getByRole("img", { name: "Current custom badge" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("button", { name: "Remove badge" })).toHaveCount(0);
});

test("saving verification leaves an uploaded badge in place", async ({ page }) => {
  const stub = `http://127.0.0.1:${process.env.E2E_STUB_PORT ?? 3703}`;
  await page.request.post(`${stub}/__stub/reset`);
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("administrator@example.org");
  await page.getByLabel("Password", { exact: true }).fill("stub-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/);
  await page.goto("/en/users?q=dilnoza");
  await page.getByRole("link", { name: "Dilnoza Karimova" }).first().click();
  await page.getByLabel("Badge image").setInputFiles({
    name: "badge.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await page.getByRole("button", { name: "Upload badge" }).click();
  await expect(page.getByText("Badge saved.")).toBeVisible();
  await page.getByLabel("Verified badge").check();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Verification updated.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Verified badge")).toBeChecked();
  await expect(page.getByRole("img", { name: "Current custom badge" })).toBeVisible();
});

test("the portal has no separate Verification section", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("administrator@example.org");
  await page.getByLabel("Password", { exact: true }).fill("stub-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/);
  const removed = await page.goto("/en/verification");
  expect(removed?.status()).toBe(404);
});
