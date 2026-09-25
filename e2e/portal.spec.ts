import { expect, test, type Locator, type Page } from "@playwright/test";

const LOCALES = ["uz", "ru", "en"] as const;

const COORDINATOR = "coordinator@example.org";
const PROVISIONED_ADMINISTRATOR = "provisioned@example.org";
const ADMINISTRATOR = "administrator@example.org";
const VOLUNTEER = "dilnoza@example.org";
const PASSWORD = "stub-password";

const STUB = `http://127.0.0.1:${process.env.E2E_STUB_PORT ?? 3703}`;

async function resetBackend(page: Page) {
  await page.request.post(`${STUB}/__stub/reset`);
}

async function signIn(page: Page, email = ADMINISTRATOR, password = PASSWORD) {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function signedIn(page: Page) {
  await signIn(page);
  await expect(page).toHaveURL(/\/en\/dashboard$/);
}

async function fillVacancyDraft(
  page: Page | Locator,
  values: {
    title: string;
    organization?: string;
    deadline?: string;
    format?: string;
  },
) {
  await page.getByLabel("Title").fill(values.title);
  await page
    .getByLabel("Description")
    .fill("Volunteers work together with a coordinator throughout the event.");
  await page
    .getByLabel("Organization")
    .selectOption({ label: values.organization ?? "Chilonzor Reading Corners" });
  await page.getByLabel("Format").selectOption(values.format ?? "onsite");
  await page.getByLabel("Place", { exact: true }).fill("Central library");
  await page.getByLabel("Places", { exact: true }).fill("12");
  await page.getByLabel("Estimated hours").fill("4");
  await page.getByLabel("Starts").fill("2026-11-01T09:00");
  await page.getByLabel("Ends").fill("2026-11-01T13:00");
  await page
    .getByLabel("Applications close")
    .fill(values.deadline ?? "2026-10-20T18:00");
}

function formMessage(page: Page) {
  return page.locator('[data-slot="form-message"]');
}

function statePanel(page: Page) {
  return page.locator('[data-slot="state-panel"]');
}

function fieldError(page: Page) {
  return page.locator('[data-slot="field-error"]');
}

function dialog(page: Page) {
  return page.getByRole("dialog");
}

function errorSummary(page: Page) {
  return page.locator('[data-slot="error-summary"]');
}

async function openDialog(page: Page, name: string | RegExp) {
  const control = page
    .getByRole("button", { name })
    .or(page.getByRole("link", { name }));
  await control.first().click();
  await expect(dialog(page)).toBeVisible();
}

async function sessionCookie(page: Page) {
  const cookies = await page.context().cookies();
  return cookies.find((cookie) => cookie.name === "volontyorlar_admin_session");
}

test.beforeEach(async ({ page }) => {
  await resetBackend(page);
});

test.describe("sign-in", () => {
  test("an administrator signs in and lands on the dashboard", async ({ page }) => {
    await signedIn(page);
    await expect(
      page.getByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeVisible();
  });

  test("a wrong password is refused without saying which half was wrong", async ({
    page,
  }) => {
    await signIn(page, ADMINISTRATOR, "not-the-password");

    await expect(page).toHaveURL(/\/en\/login$/);
    await expect(formMessage(page)).toContainText(
      "do not match an account for this portal",
    );
    expect(await sessionCookie(page)).toBeUndefined();
  });

  test("a coordinator cannot sign in to the administrator portal", async ({ page }) => {
    await signIn(page, COORDINATOR);

    await expect(page).toHaveURL(/\/en\/login$/);
    await expect(formMessage(page)).toBeVisible();
    expect(await sessionCookie(page)).toBeUndefined();
  });

  test("a volunteer cannot sign in to the administrator portal", async ({ page }) => {
    await signIn(page, VOLUNTEER);

    await expect(page).toHaveURL(/\/en\/login$/);
    expect(await sessionCookie(page)).toBeUndefined();
  });

  test("the sign-in page offers no way to create an account", async ({ page }) => {
    await page.goto("/en/login");

    await expect(
      page.getByRole("link", { name: /create|sign up|register/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /create|sign up|register/i }),
    ).toHaveCount(0);
    await expect(
      page.getByText(
        "Administrator accounts are not created through any web interface",
      ),
    ).toBeVisible();
  });

  test("there is no signup or password-recovery route", async ({ page }) => {
    for (const path of ["/en/signup", "/en/register", "/en/forgot-password"]) {
      const response = await page.request.get(path, { maxRedirects: 0 });
      expect(response.status(), path).toBe(404);
    }
  });
});

test.describe("the session", () => {
  test("keeps the session token out of the browser", async ({ page }) => {
    await signedIn(page);

    const cookie = await sessionCookie(page);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("Strict");
    expect(cookie?.value).not.toContain("access-");
    expect(cookie?.value).not.toContain("refresh-");

    const html = await page.content();
    expect(html).not.toContain("access-");
    expect(html).not.toContain("refresh-");

    const stored = await page.evaluate(() => ({
      local: JSON.stringify(localStorage),
      session: JSON.stringify(sessionStorage),
    }));
    expect(stored.local).toBe("{}");
    expect(stored.session).toBe("{}");
  });

  test("carries one unchanged session as the administrator moves around", async ({
    page,
  }) => {
    await signedIn(page);
    const first = await sessionCookie(page);

    await page.goto("/en/vacancies");
    await expect(page).toHaveURL(/\/en\/vacancies$/);

    const second = await sessionCookie(page);
    expect(second?.value).toBe(first?.value);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Vacancies");

    await page.goto("/en/dashboard");
    await expect(page).toHaveURL(/\/en\/dashboard$/);
    expect((await sessionCookie(page))?.value).toBe(first?.value);
  });

  test("sends an unauthenticated visitor to sign-in and remembers where they wanted to go", async ({
    page,
  }) => {
    await page.goto("/en/applications");

    await expect(page).toHaveURL(/\/en\/login\?next=%2Fen%2Fapplications/);
  });

  test("ends when the cookie no longer decrypts", async ({ page }) => {
    await signedIn(page);
    await page.context().clearCookies({ name: "volontyorlar_admin_session" });
    await page.context().addCookies([
      {
        name: "volontyorlar_admin_session",
        value: "tampered-value",
        domain: "127.0.0.1",
        path: "/",
      },
    ]);

    await page.goto("/en/dashboard");
    await expect(page).toHaveURL(/\/en\/login/);
    await expect(formMessage(page)).toContainText("session");
  });

  test("keeps the session when a guest page redirects a signed-in coordinator", async ({
    page,
  }) => {
    await signedIn(page);
    const before = await sessionCookie(page);

    await page.goto("/en/login");
    await expect(page).toHaveURL(/\/en\/dashboard$/);

    const after = await sessionCookie(page);
    expect(after?.value).toBe(before?.value);

    await page.goto("/en/vacancies");
    await expect(page).toHaveURL(/\/en\/vacancies$/);
  });

  test("keeps the session while a required password change redirects", async ({
    page,
  }) => {
    await signIn(page, PROVISIONED_ADMINISTRATOR);
    await expect(page).toHaveURL(/\/en\/account\/change-password$/);
    const before = await sessionCookie(page);

    await page.goto("/en/vacancies");
    await expect(page).toHaveURL(/\/en\/account\/change-password$/);

    const after = await sessionCookie(page);
    expect(after?.value).toBe(before?.value);
  });

  test("signs out and clears the cookie", async ({ page }) => {
    await signedIn(page);
    await page.getByRole("button", { name: "Sign out" }).click();

    await expect(page).toHaveURL(/\/en\/login\?session=signedOut/);
    expect(await sessionCookie(page)).toBeFalsy();

    await page.goto("/en/dashboard");
    await expect(page).toHaveURL(/\/en\/login/);
  });
});

test.describe("an administrator sees everything", () => {
  test("lists every vacancy, whoever created it", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/vacancies");

    await expect(page.getByRole("row", { name: /Winter book drive/ })).toHaveCount(1);
    await expect(page.getByRole("row", { name: /City sports day/ })).toHaveCount(1);
  });

  test("lists every application", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/applications");

    const rows = page.getByRole("row");
    await expect(rows.filter({ hasText: "Winter book drive" })).not.toHaveCount(0);
    await expect(rows.filter({ hasText: "City sports day" })).not.toHaveCount(0);
  });

  test("opens a vacancy another coordinator created", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/vacancies/00000000-0000-4000-8000-000000000403");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "City sports day",
    );
  });

  test("opens any volunteer, not only applicants to one coordinator", async ({
    page,
  }) => {
    await signedIn(page);
    await page.goto("/en/users/00000000-0000-4000-8000-000000000203");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Aziza");
  });

  test("shows a volunteer's whole profile today and whether it lets them apply", async ({
    page,
  }) => {
    await signedIn(page);
    await page.goto("/en/users/00000000-0000-4000-8000-000000000201");

    const profile = page.locator("section").filter({
      has: page.getByRole("heading", { level: 2, name: "Profile", exact: true }),
    });
    await expect(profile.getByText("Profile complete")).toBeVisible();
    await expect(profile.getByText("@dilnoza_karimova")).toBeVisible();
    await expect(
      profile.getByText("I volunteer at the reading room on Saturdays."),
    ).toBeVisible();
    await expect(profile.getByText("+998901234567")).toBeVisible();
    await expect(
      profile.getByRole("link", { name: "https://www.linkedin.com/in/dilnoza-k" }),
    ).toHaveAttribute("rel", "noopener noreferrer");

    await page.goto("/en/users/00000000-0000-4000-8000-000000000203");
    await expect(page.getByText("Profile incomplete")).toBeVisible();
    await expect(
      page.getByText(
        "Still missing before they can apply: Bio, City or district, Year or grade, Languages, Phone, Telegram.",
      ),
    ).toBeVisible();
  });
});

test.describe("the vacancy lifecycle", () => {
  const PENDING = "00000000-0000-4000-8000-000000000405";
  const APPROVED = "00000000-0000-4000-8000-000000000401";

  test("filters the list down to what is waiting for approval", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/vacancies?state=pending_review");

    await expect(page.getByRole("row", { name: /Winter clothing drive/ })).toHaveCount(
      1,
    );
    await expect(page.getByRole("row", { name: /Winter book drive/ })).toHaveCount(0);
  });

  test("counts what is waiting for approval and filters to it in one click", async ({
    page,
  }) => {
    await signedIn(page);
    await page.goto("/en/vacancies");

    await page.getByRole("link", { name: /Waiting for approval/ }).click();

    await expect(page).toHaveURL(/state=pending_review/);
    await expect(page.getByRole("row", { name: /Winter clothing drive/ })).toHaveCount(
      1,
    );
  });

  test("approves a pending vacancy and publishes it", async ({ page }) => {
    await signedIn(page);
    await page.goto(`/en/vacancies/${PENDING}`);

    await openDialog(page, "Approve and publish");
    await dialog(page).getByRole("button", { name: "Approve and publish" }).click();

    await expect(page.getByText("Approved and published").first()).toBeVisible();
  });

  test("shows what approval still needs before it lets the decision through", async ({
    page,
  }) => {
    await signedIn(page);
    await page.goto("/en/vacancies");

    await openDialog(page, "New vacancy");
    await fillVacancyDraft(dialog(page), {
      title: "Riverbank clean-up",
      organization: "Green Corridor Group — not verified",
    });
    await dialog(page).getByRole("button", { name: "Create the draft" }).click();
    await expect(dialog(page)).toHaveCount(0);

    await page.goto("/en/vacancies?q=riverbank");
    await page.getByRole("link", { name: "Open" }).first().click();

    await openDialog(page, "Publish now");
    const blocked = dialog(page);
    await expect(blocked).toContainText("This vacancy is not ready yet");
    await expect(blocked).toContainText("a verified organization");
    await expect(blocked.getByRole("button", { name: "Publish now" })).toBeDisabled();
  });

  test("refuses to request changes without a note, in red, beside the field", async ({
    page,
  }) => {
    await signedIn(page);
    await page.goto(`/en/vacancies/${PENDING}`);

    await openDialog(page, "Request changes");
    await dialog(page).getByRole("button", { name: "Request changes" }).click();

    await expect(dialog(page)).toBeVisible();
    await expect(fieldError(page).first()).toContainText("Write a note");
    await expect(errorSummary(page)).toHaveCount(0);
  });

  test("keeps the dialog open and lists every field that needs attention", async ({
    page,
  }) => {
    await signedIn(page);
    await page.goto("/en/vacancies");

    await openDialog(page, "New vacancy");
    await dialog(page).getByRole("button", { name: "Create the draft" }).click();

    await expect(dialog(page)).toBeVisible();
    await expect(errorSummary(page)).toBeVisible();
    await expect(errorSummary(page)).toContainText("Title");
    await expect(errorSummary(page)).toContainText("Description");
    await expect(dialog(page).getByLabel("Title")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  test("sends a vacancy back for changes with a note the coordinator reads", async ({
    page,
  }) => {
    await signedIn(page);
    await page.goto(`/en/vacancies/${PENDING}`);

    await openDialog(page, "Request changes");
    await dialog(page)
      .getByLabel("Note to the coordinator")
      .fill("Name the venue, please.");
    await dialog(page).getByRole("button", { name: "Request changes" }).click();

    await expect(page.getByText("Changes requested").first()).toBeVisible();
    await expect(statePanel(page).first()).toContainText("Name the venue");
  });

  test("offers no decision on a vacancy that is already approved", async ({ page }) => {
    await signedIn(page);
    await page.goto(`/en/vacancies/${APPROVED}`);

    await expect(page.getByRole("button", { name: "Approve and publish" })).toHaveCount(
      0,
    );
    await expect(page.getByRole("button", { name: "Request changes" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Reject" })).toHaveCount(0);
  });

  test("keeps an administrator edit intact when saving finds an invalid deadline", async ({
    page,
  }) => {
    await signedIn(page);
    await page.goto(`/en/vacancies/${APPROVED}`);

    await openDialog(page, "Edit vacancy");
    await dialog(page).getByLabel("Title").fill("Revised winter book drive");
    await dialog(page).getByLabel("Applications close").fill("2099-11-05T18:00");
    await dialog(page).getByRole("button", { name: "Save changes" }).click();

    await expect(dialog(page).getByLabel("Title")).toHaveValue(
      "Revised winter book drive",
    );
    await expect(dialog(page).getByLabel("Applications close")).toHaveValue(
      "2099-11-05T18:00",
    );
    await expect(dialog(page).locator('[data-slot="field-error"]')).toContainText(
      "deadline must fall before the vacancy starts",
    );

    await dialog(page).getByRole("button", { name: "Save changes" }).click();
    await expect(dialog(page).getByLabel("Title")).toHaveValue(
      "Revised winter book drive",
    );
    await expect(dialog(page).getByLabel("Applications close")).toHaveValue(
      "2099-11-05T18:00",
    );
  });

  test("creates a draft, publishes it directly, then archives it", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/vacancies");

    await openDialog(page, "New vacancy");
    await fillVacancyDraft(dialog(page), {
      title: "Library shelving day",
    });
    await dialog(page).getByRole("button", { name: "Create the draft" }).click();
    await expect(dialog(page)).toHaveCount(0);

    await page.goto("/en/vacancies?state=draft");
    await page
      .getByRole("row", { name: /Library shelving day/ })
      .getByRole("link", { name: "Open" })
      .click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Library shelving day",
    );

    await openDialog(page, "Publish now");
    await dialog(page).getByRole("button", { name: "Publish now" }).click();
    await expect(
      page.getByText("Approved and published", { exact: true }).first(),
    ).toBeVisible();

    await openDialog(page, "Archive");
    await dialog(page).getByRole("button", { name: "Archive", exact: true }).click();
    await expect(page.getByText("This vacancy is archived")).toBeVisible();
  });

  test("edits a draft in a dialog without leaving the vacancy", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/vacancies/00000000-0000-4000-8000-000000000402");

    await openDialog(page, "Edit vacancy");
    await dialog(page).getByLabel("Title").fill("Reading room weekends, revised");
    await dialog(page).getByRole("button", { name: "Save changes" }).click();

    await expect(dialog(page)).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("revised");
  });

  test("says a rejection is permanent and refuses it without a reason", async ({
    page,
  }) => {
    await signedIn(page);
    await page.goto(`/en/vacancies/${PENDING}`);

    await openDialog(page, "Reject");
    await expect(dialog(page)).toContainText("permanently");
    await dialog(page).getByRole("button", { name: "Reject permanently" }).click();
    await expect(fieldError(page).first()).toContainText("Write a note");

    await dialog(page)
      .getByLabel("Note to the coordinator")
      .fill("This vacancy cannot be safely published.");
    await dialog(page).getByRole("button", { name: "Reject permanently" }).click();

    await expect(page.getByText("Rejected", { exact: true }).first()).toBeVisible();
  });

  test("rejects a deadline that falls after the vacancy starts", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/vacancies/new");

    await fillVacancyDraft(page, {
      title: "Late deadline",
      deadline: "2026-11-05T18:00",
    });
    await page.getByRole("button", { name: "Create the draft" }).click();

    await expect(page.locator("#vacancy-new-applicationDeadline-error")).toContainText(
      "deadline must fall before the vacancy starts",
    );
  });

  test("refuses meeting credentials in the public online location", async ({
    page,
  }) => {
    await signedIn(page);
    await page.goto("/en/vacancies/new");

    await fillVacancyDraft(page, {
      title: "Remote help",
      format: "remote",
    });
    await page.getByLabel("Place", { exact: true }).fill("Zoom, passcode 4821");
    await page.getByRole("button", { name: "Create the draft" }).click();

    await expect(fieldError(page)).toContainText("Remove the meeting password");
  });

  test("warns in the form itself that an unverified organization blocks approval", async ({
    page,
  }) => {
    await signedIn(page);
    await page.goto("/en/vacancies/new");

    await page
      .getByLabel("Organization")
      .selectOption({ label: "Green Corridor Group — not verified" });

    await expect(page.getByText("not verified yet").first()).toBeVisible();
  });
});

test.describe("review and attendance", () => {
  test("leaves out applications a volunteer has not sent", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/applications");

    const rows = page.getByRole("row");
    await expect(rows.filter({ hasText: "Dilnoza Karimova" })).toHaveCount(1);
    await expect(rows.filter({ hasText: "Jasur Qodirov" })).toHaveCount(0);
    await expect(page.getByRole("option", { name: "Draft" })).toHaveCount(0);
  });

  test("shows a profile-only application without an empty answers panel", async ({
    page,
  }) => {
    await signedIn(page);
    await page.goto("/en/applications/00000000-0000-4000-8000-000000000607");

    await expect(
      page.getByRole("heading", { level: 2, name: "Profile as submitted" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Answers" })).toHaveCount(
      0,
    );
    await expect(page.getByText("Tashkent city")).toBeVisible();
    await expect(page.getByText("Uzbek, Russian")).toBeVisible();
    await expect(page.getByText("@dilnoza_reads")).toBeVisible();
    await expect(page.getByText("Chilonzor")).toBeVisible();
    await expect(page.getByText("Year or grade", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "@dilnoza_k" })).toHaveAttribute(
      "href",
      "https://t.me/dilnoza_k",
    );
    await expect(page.getByRole("link", { name: "@dilnoza.reads" })).toHaveAttribute(
      "href",
      "https://www.instagram.com/dilnoza.reads/",
    );
    await expect(
      page.getByRole("link", { name: "https://portfolio.example/dilnoza" }),
    ).toHaveAttribute("target", "_blank");
    await expect(page.getByText("Phone", { exact: true })).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 2, name: "Record a decision" }),
    ).toBeVisible();
  });

  test("explains that an unsent draft has nothing to decide", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/applications/00000000-0000-4000-8000-000000000606");

    await expect(statePanel(page).first()).toContainText("Not sent yet");
    await expect(page.getByText("can no longer be reviewed")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 2, name: "Record a decision" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 2, name: "Profile as submitted" }),
    ).toHaveCount(0);
  });

  test("records a decision on an application", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/applications?status=submitted");
    await page.getByRole("link", { name: "Open" }).first().click();

    await expect(
      page.getByRole("heading", { level: 2, name: "Answers" }),
    ).toBeVisible();
    await page.getByLabel("Decision").selectOption("accepted");
    await page.getByLabel("Note to the volunteer").fill("See you on the day.");
    await page.getByRole("button", { name: "Record the decision" }).click();

    await expect(formMessage(page)).toContainText("decision was recorded");
  });

  test("groups unresolved attendance by vacancy and links to the vacancy", async ({
    page,
  }) => {
    await signedIn(page);
    await page.goto("/en/attendance");

    await expect(
      page.getByRole("heading", { level: 2, name: "Winter book drive" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Open the vacancy" }).first().click();

    await expect(page).toHaveURL(/\/en\/vacancies\/[0-9a-f-]+$/);
  });

  test("confirms a batch of accepted volunteers, then corrects one row", async ({
    page,
  }) => {
    await signedIn(page);
    await page.goto("/en/vacancies/00000000-0000-4000-8000-000000000401");

    const roster = page
      .locator("section")
      .filter({ hasText: "Confirm the selected volunteers" })
      .first();
    await expect(
      roster.getByRole("button", { name: "Confirm selected" }),
    ).toBeVisible();

    await roster.getByLabel("Outcome for everyone selected").selectOption("attended");
    const hours = roster.getByLabel("Hours for everyone selected");
    await expect(hours).toHaveValue("6");
    await hours.fill("");
    await roster.getByRole("button", { name: "Confirm selected" }).click();
    await expect(roster.locator('[data-slot="field-error"]').first()).toContainText(
      "Enter the hours",
    );

    await roster.getByLabel("Hours for everyone selected").fill("4");
    await roster.getByRole("button", { name: "Confirm selected" }).click();
    await expect(roster.locator('[data-slot="form-message"]').first()).toContainText(
      "Attendance was confirmed",
    );

    await page.reload();
    await expect(roster.getByText("Attended").first()).toBeVisible();

    await roster.locator("summary").first().click();
    await roster.getByLabel("Outcome", { exact: true }).first().selectOption("excused");
    await roster.getByRole("button", { name: "Save the decision" }).first().click();
    await expect(roster.locator('[data-slot="form-message"]').first()).toContainText(
      "Attendance was confirmed",
    );
  });

  test("keeps attendance shut until the event has ended", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/vacancies/00000000-0000-4000-8000-000000000402");

    await expect(statePanel(page).last()).toContainText("Attendance is not open yet");
    await expect(page.getByRole("button", { name: "Confirm selected" })).toHaveCount(0);
  });
});

test.describe("volunteers and passwords", () => {
  test("shows password-login state without ever offering the password", async ({
    page,
  }) => {
    await signedIn(page);
    await page.goto("/en/users");
    await page.getByRole("link", { name: "Open" }).first().click();

    await expect(page.getByText("Password last changed")).toBeVisible();
    await expect(
      page.getByText("An existing password can never be read"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /show the password|reveal/i }),
    ).toHaveCount(0);
  });

  test("assigns a replacement temporary password", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/users");
    await page.getByRole("link", { name: "Open" }).first().click();

    await page.getByLabel("Temporary password").fill("a-temporary-password");
    await page.getByRole("button", { name: "Assign it" }).click();

    await expect(formMessage(page)).toContainText("temporary password was assigned");
  });

  test("refuses a temporary password the backend would reject", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/users");
    await page.getByRole("link", { name: "Open" }).first().click();

    await page.getByLabel("Temporary password").fill("short");
    await page.getByRole("button", { name: "Assign it" }).click();

    await expect(fieldError(page)).toContainText("at least 8 characters");
  });
});

test.describe("the first password change", () => {
  test("blocks the portal until the temporary password is replaced", async ({
    page,
  }) => {
    await signIn(page, PROVISIONED_ADMINISTRATOR);
    await expect(page).toHaveURL(/\/en\/account\/change-password$/);

    await page.goto("/en/coordinators");
    await expect(page).toHaveURL(/\/en\/account\/change-password$/);
    await expect(page.getByText("temporary password").first()).toBeVisible();

    await page.getByLabel("Current password").fill(PASSWORD);
    await page.getByLabel("New password", { exact: true }).fill("a-brand-new-password");
    await page.getByLabel("Repeat the new password").fill("a-brand-new-password");
    await page.getByRole("button", { name: "Change the password" }).click();

    await expect(formMessage(page)).toContainText("password was changed");
    await page.getByRole("link", { name: "Go to the dashboard" }).click();
    await expect(page).toHaveURL(/\/en\/dashboard$/);
  });

  test("refuses a mismatched confirmation", async ({ page }) => {
    await signIn(page, PROVISIONED_ADMINISTRATOR);
    await page.getByLabel("Current password").fill(PASSWORD);
    await page.getByLabel("New password", { exact: true }).fill("a-brand-new-password");
    await page.getByLabel("Repeat the new password").fill("something-else");
    await page.getByRole("button", { name: "Change the password" }).click();

    await expect(fieldError(page)).toContainText("do not match");
  });
});

test.describe("activity", () => {
  test("lists only what this administrator did", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/activity");

    await expect(page.getByRole("cell", { name: "coordinator.created" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "opportunity.published" })).toHaveCount(
      0,
    );
  });

  test("keeps its filters in the URL", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/activity");

    await page.getByLabel("Search the history").fill("coordinator");
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page).toHaveURL(/q=coordinator/);
    await expect(page.getByRole("cell", { name: "coordinator.created" })).toBeVisible();
  });
});

test.describe("every locale and the keyboard", () => {
  for (const locale of LOCALES) {
    test(`signs in and renders the dashboard in ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}/login`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      const email = page.locator("#email");
      const password = page.locator("#password");
      await email.fill(ADMINISTRATOR);
      await password.fill(PASSWORD);
      await page.locator("form button[type=submit]").click();

      await expect(page).toHaveURL(new RegExp(`/${locale}/dashboard$`));
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    });
  }

  test("keeps one h1 per page and a labelled navigation", async ({ page }) => {
    await signedIn(page);

    for (const path of [
      "/en/dashboard",
      "/en/vacancies",
      "/en/applications",
      "/en/users",
    ]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 }), path).toHaveCount(1);
    }

    const narrow = (page.viewportSize()?.width ?? 1280) < 1024;

    if (narrow) {
      await page.getByRole("button", { name: "Open the menu" }).click();
      await expect(
        page.getByRole("navigation", { name: "Portal sections" }).first(),
      ).toBeVisible();
      await page.getByRole("button", { name: "Close the menu" }).click();
    } else {
      await expect(
        page.getByRole("navigation", { name: "Portal sections" }).first(),
      ).toBeVisible();
    }
  });

  test("reaches the sign-in form and submits it with the keyboard alone", async ({
    page,
  }) => {
    await page.goto("/en/login");

    await page.locator("#email").focus();
    await page.keyboard.type(ADMINISTRATOR);
    await page.keyboard.press("Tab");
    await page.keyboard.type(PASSWORD);
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/en\/dashboard$/);
  });

  test("gives every form control a label", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/vacancies/new");

    const unlabelled = await page.evaluate(
      () =>
        [...document.querySelectorAll("input, select, textarea")].filter((element) => {
          if (element instanceof HTMLInputElement && element.type === "hidden")
            return false;
          const id = element.getAttribute("id");
          const labelled =
            (id && document.querySelector(`label[for="${id}"]`)) ||
            element.getAttribute("aria-label") ||
            element.getAttribute("aria-labelledby") ||
            element.closest("label");
          return !labelled;
        }).length,
    );

    expect(unlabelled).toBe(0);
  });

  test("keeps every response out of search indexes", async ({ page }) => {
    const login = await page.request.get("/en/login");
    expect(login.headers()["x-robots-tag"]).toContain("noindex");

    const robots = await page.request.get("/robots.txt");
    expect(await robots.text()).toContain("Disallow: /");
  });
});

test.describe("coordinator management", () => {
  test("creates a coordinator with a permanent password", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/coordinators/new");

    await page.getByLabel("Full name").fill("Shahnoza Rasulova");
    await page.getByLabel("Email").fill("shahnoza@example.org");
    await page.getByLabel("Permanent password").fill("a-permanent-password");
    await page.getByRole("button", { name: "Create the coordinator" }).click();

    await expect(formMessage(page)).toContainText("can keep using this password");

    await page.goto("/en/coordinators?q=shahnoza");
    await expect(page.getByRole("row", { name: /Shahnoza Rasulova/ })).toContainText(
      "Password set",
    );
  });

  test("refuses an email another account already uses", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/coordinators/new");

    await page.getByLabel("Full name").fill("Duplicate Person");
    await page.getByLabel("Email").fill(COORDINATOR);
    await page.getByLabel("Permanent password").fill("a-permanent-password");
    await page.getByRole("button", { name: "Create the coordinator" }).click();

    await expect(formMessage(page)).toContainText("already uses this email");
  });

  test("blocks and unblocks a coordinator", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/coordinators/00000000-0000-4000-8000-000000000101");

    await openDialog(page, /^Block$/);
    await dialog(page).getByRole("button", { name: "Block", exact: true }).click();
    await expect(page.getByText("Blocked", { exact: true }).first()).toBeVisible();

    await openDialog(page, /^Unblock$/);
    await dialog(page).getByRole("button", { name: "Unblock", exact: true }).click();
    await expect(page.getByText("Active", { exact: true }).first()).toBeVisible();
  });

  test("a blocked coordinator can no longer sign in", async ({ page, context }) => {
    await signedIn(page);
    await page.goto("/en/coordinators/00000000-0000-4000-8000-000000000101");
    await openDialog(page, /^Block$/);
    await dialog(page).getByRole("button", { name: "Block", exact: true }).click();
    await expect(page.getByText("Blocked", { exact: true }).first()).toBeVisible();

    await context.clearCookies();
    await page.goto("/en/login");
    await page.getByLabel("Email").fill(COORDINATOR);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(formMessage(page)).toBeVisible();
  });

  test("requires reassignment before removing a coordinator who owns vacancies", async ({
    page,
  }) => {
    await signedIn(page);
    await page.goto("/en/coordinators/00000000-0000-4000-8000-000000000101");

    await openDialog(page, /^Remove$/);
    const removal = dialog(page);
    await expect(removal.getByLabel("Give their active vacancies to")).toBeVisible();

    await removal
      .getByLabel("Give their active vacancies to")
      .selectOption({ label: "Bekzod Rustamov" });
    await removal.getByRole("button", { name: "Remove", exact: true }).click();

    await expect(page.getByText("Removed", { exact: true }).first()).toBeVisible();

    await page.goto("/en/coordinators/00000000-0000-4000-8000-000000000102");
    await expect(page.getByText("Winter book drive")).toBeVisible();
  });

  test("assigns a coordinator a replacement temporary password", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/coordinators/00000000-0000-4000-8000-000000000101");

    await page.getByLabel("Temporary password").fill("another-temporary-password");
    await page.getByRole("button", { name: "Assign it" }).click();

    await expect(formMessage(page).last()).toContainText(
      "temporary password was assigned",
    );
  });

  test("summarises every coordinator account above the page it is showing", async ({
    page,
  }) => {
    await signedIn(page);
    await page.goto("/en/coordinators");

    const summary = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Coordinator accounts" }) });

    await expect(summary).toBeVisible();
    for (const state of ["Active", "Blocked", "Removed"]) {
      await expect(summary.getByText(state, { exact: true })).toBeVisible();
    }

    await expect(page.getByRole("row", { name: /Nodira Alimova/ })).toContainText(
      "coordinator@example.org",
    );
  });

  test("offers no way to create or reset an administrator", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/coordinators");

    await expect(
      page.getByText("Administrators cannot be created, listed or reset here"),
    ).toBeVisible();
    await expect(page.getByRole("row", { name: /Stub Administrator/ })).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: /new administrator|create admin/i }),
    ).toHaveCount(0);
  });

  test("offers no impersonation control anywhere in the portal", async ({ page }) => {
    await signedIn(page);

    for (const path of ["/en/coordinators", "/en/users", "/en/dashboard"]) {
      await page.goto(path);
      await expect(
        page.getByRole("button", { name: /sign in as|impersonate|view as/i }),
        path,
      ).toHaveCount(0);
    }
  });
});

test.describe("organizations and the audit history", () => {
  test("creates an organization in a dialog and marks it verified", async ({
    page,
  }) => {
    await signedIn(page);
    await page.goto("/en/organizations");

    await openDialog(page, "New organization");
    await dialog(page).getByLabel("Name").fill("Fergana Youth Union");
    await dialog(page).getByLabel("Address").fill("fergana-youth-union");
    await dialog(page).getByLabel("Verified").check();
    await dialog(page).getByRole("button", { name: "Create the organization" }).click();

    await expect(dialog(page)).toHaveCount(0);
    await expect(page.getByRole("row", { name: /Fergana Youth Union/ })).toContainText(
      "Verified",
    );
  });

  test("edits one organization without unfolding every other row", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/organizations");

    await expect(page.getByLabel("Name", { exact: true })).toHaveCount(0);

    await page
      .getByRole("row", { name: /Green Corridor Group/ })
      .getByRole("button", { name: /Edit/ })
      .click();

    await expect(dialog(page).getByLabel("Name")).toHaveValue("Green Corridor Group");
    await dialog(page).getByLabel("Verified").check();
    await dialog(page).getByRole("button", { name: "Save changes" }).click();

    await expect(dialog(page)).toHaveCount(0);
    await expect(page.getByRole("row", { name: /Green Corridor Group/ })).toContainText(
      "Verified",
    );
  });

  test("filters the audit history by coordinator and by action", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/audit");

    await expect(
      page.getByRole("cell", { name: "opportunity.published" }),
    ).toBeVisible();

    await page.getByLabel("Coordinator").selectOption({ label: "Nodira Alimova" });
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page).toHaveURL(/actor=/);
    await expect(
      page.getByRole("cell", { name: "opportunity.published" }),
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: "coordinator.created" })).toHaveCount(
      0,
    );
  });

  test("filters the audit history by action", async ({ page }) => {
    await signedIn(page);
    await page.goto("/en/audit");

    await page.getByLabel("Action").selectOption("coordinator.created");
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page).toHaveURL(/action=coordinator.created/);
    await expect(page.getByRole("cell", { name: "coordinator.created" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "opportunity.published" })).toHaveCount(
      0,
    );
  });

  test("offers the whole action vocabulary, not only what is on the page", async ({
    page,
  }) => {
    await signedIn(page);
    await page.goto("/en/audit");

    const options = await page.getByLabel("Action").locator("option").allTextContents();

    expect(options).toContain("attendance.resolved");
    expect(options).toContain("coordinator.removed");
  });
});

test.describe("the dashboard charts", () => {
  test("charts the pipeline, the trend and every breakdown from real counts", async ({
    page,
  }) => {
    await signedIn(page);

    const panel = (name: string) =>
      page.locator("section").filter({ has: page.getByRole("heading", { name }) });

    await expect(
      page.getByRole("heading", { name: "Application pipeline" }),
    ).toBeVisible();
    const pipeline = panel("Application pipeline");
    for (const stage of [
      "Applications",
      "Awaiting review",
      "Accepted",
      "Attendance to confirm",
      "Attended",
    ]) {
      await expect(pipeline.getByText(stage, { exact: true })).toBeVisible();
    }

    await expect(page.getByText("Vacancies published")).toBeVisible();
    await expect(page.getByText("Attendance confirmed")).toBeVisible();

    for (const title of [
      "Applications submitted",
      "Applications by status",
      "Vacancies by region",
      "Vacancies by stage",
      "Vacancies by format",
    ]) {
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
    }

    const stages = panel("Vacancies by stage");
    await expect(stages.getByText("Published", { exact: true })).toBeVisible();
    await expect(stages.getByText("Draft", { exact: true })).toBeVisible();
    await expect(stages.getByText("Archived", { exact: true })).toBeVisible();
  });

  test("draws no bar for a count of zero rather than inventing one", async ({
    page,
  }) => {
    await signedIn(page);

    const widths = await page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Application pipeline" }) })
      .locator("li > div > div")
      .evaluateAll((bars) => bars.map((bar) => (bar as HTMLElement).style.inlineSize));

    expect(widths.length).toBe(5);
    expect(widths.every((width) => /^\d/.test(width))).toBe(true);
  });

  test("draws the joining rate as a line with a readable scale", async ({ page }) => {
    await signedIn(page);

    const joins = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Volunteers joining" }) });

    await expect(joins).toBeVisible();
    await expect(joins.locator("li")).not.toHaveCount(0);
    await expect(joins.getByText("0", { exact: true })).toBeVisible();
    await expect(joins).toContainText("volunteers between");
  });

  test("keeps the background out of the accessibility tree and off the pointer", async ({
    page,
  }) => {
    await signedIn(page);

    const background = page.locator("canvas").locator("..");
    await expect(background).toHaveAttribute("aria-hidden", "true");
    await expect(background).toHaveCSS("pointer-events", "none");
  });
});

test.describe("failures a screen has to explain", () => {
  test("offers the password page once the API starts requiring a change", async ({
    page,
  }) => {
    await signedIn(page);
    await page.request.post(`${STUB}/__stub/require-password-change`, {
      data: { email: ADMINISTRATOR },
    });

    await page.goto("/en/vacancies");

    await expect(statePanel(page)).toContainText("Change your password first");
    await page.getByRole("link", { name: "Change password" }).click();
    await expect(page).toHaveURL(/\/en\/account\/change-password$/);
  });

  test("explains a required password change the session has not learned about yet", async ({
    page,
  }) => {
    await signedIn(page);
    await page.request.post(`${STUB}/__stub/break`, {
      data: {
        path: "/admin/opportunities",
        status: 403,
        code: "passwordChangeRequired",
      },
    });

    await page.goto("/en/vacancies");

    await expect(statePanel(page)).toContainText("Change your password first");
    await expect(page.getByRole("link", { name: "Change password" })).toBeVisible();

    await page.request.post(`${STUB}/__stub/break`, { data: { path: null } });
  });

  test("explains a backend failure with its own code, not a blank panel", async ({
    page,
  }) => {
    await signedIn(page);
    await page.request.post(`${STUB}/__stub/break`, {
      data: {
        path: "/admin/statistics",
        status: 503,
        code: "adminWorkflowsDisabled",
      },
    });

    await page.goto("/en/dashboard");

    await expect(statePanel(page)).toContainText(
      "The API has these workflows switched off",
    );

    await page.request.post(`${STUB}/__stub/break`, { data: { path: null } });
  });
});
