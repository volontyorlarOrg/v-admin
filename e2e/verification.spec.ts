import { expect, test } from "@playwright/test";

test("an administrator assigns and revokes a volunteer's marks", async ({ page }) => {
  const stub = `http://127.0.0.1:${process.env.E2E_STUB_PORT ?? 3703}`;
  await page.request.post(`${stub}/__stub/reset`);
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("administrator@example.org");
  await page.getByLabel("Password", { exact: true }).fill("stub-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/);
  await page.goto("/en/verification");
  await page.getByRole("link", { name: "Dilnoza Karimova" }).click();
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
  await page.getByLabel("Organization affiliation").selectOption("");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Verification updated.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Verified badge")).not.toBeChecked();
  await expect(page.getByLabel("Organization affiliation")).toHaveValue("");
});
