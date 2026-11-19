import { fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import en from "@/i18n/messages/en.json";
import { ExportVolunteersDialog } from "@/components/results/export-volunteers-dialog";
import type { ExportOptions } from "@/lib/exports/schemas";

const download = vi.fn();
const google = vi.fn();

vi.mock("@/lib/exports/actions", () => ({
  downloadVolunteerExportAction: (...args: unknown[]) => download(...args),
  startGoogleSheetsExportAction: (...args: unknown[]) => google(...args),
}));

const person = [
  "fullName",
  "telegram",
  "phone",
  "username",
  "region",
  "school",
] as const;

function options(googleSheets = false): ExportOptions {
  const fields = (extra: readonly string[]) =>
    [...person, ...extra].map((key) => ({
      key: key as ExportOptions["applications"][number]["key"],
      selected: ["fullName", "telegram", "phone"].includes(key),
    }));
  return {
    formats: googleSheets
      ? ["pdf", "xlsx", "txt", "google_sheets"]
      : ["pdf", "xlsx", "txt"],
    applications: fields(["applicationStatus", "appliedAt"]),
    attendance: fields(["attendance", "hours"]),
    googleSheets,
  };
}

function open(props: Partial<Parameters<typeof ExportVolunteersDialog>[0]> = {}) {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ExportVolunteersDialog
        vacancyId="00000000-0000-4000-8000-000000000010"
        list="applications"
        options={options()}
        count={3}
        filter="all"
        query=""
        {...props}
      />
    </NextIntlClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Export volunteers" }));
  return screen.getByRole("dialog");
}

describe("ExportVolunteersDialog", () => {
  it("preselects only full name, Telegram and phone", () => {
    const dialog = open();
    const checked = within(dialog)
      .getAllByRole("checkbox")
      .filter((box) => (box as HTMLInputElement).checked)
      .map((box) => box.closest("label")?.textContent);
    expect(checked).toEqual(["Full name", "Telegram", "Phone number"]);
    expect(within(dialog).getByRole("radio", { name: /PDF/ })).toBeChecked();
    expect(
      within(dialog).queryByText(/picture|photo/i, { selector: "label" }),
    ).toBeNull();
    expect(
      within(dialog).getByText(/Profile pictures are never exported/),
    ).toBeVisible();
  });

  it("offers Google Sheets only when the server has it set up", () => {
    const dialog = open();
    expect(within(dialog).getByRole("radio", { name: /Google Sheets/ })).toBeDisabled();
  });

  it("sends the ticked fields with the desk's search and filter", async () => {
    download.mockResolvedValue({ ok: false, code: "exportEmpty" });
    const dialog = open({ filter: "accepted", query: "aziz", count: 1 });
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "School" }));
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Phone number" }));
    fireEvent.click(within(dialog).getByRole("radio", { name: /Excel/ }));
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Download Excel (XLSX)" }),
    );
    expect(download).toHaveBeenCalledWith(
      {
        vacancyId: "00000000-0000-4000-8000-000000000010",
        list: "applications",
        fields: ["fullName", "telegram", "school"],
        filter: "accepted",
        query: "aziz",
      },
      "xlsx",
    );
    expect(
      await within(dialog).findByText(
        "No volunteers match the current search and filter.",
      ),
    ).toBeVisible();
  });

  it("will not export nothing", () => {
    const dialog = open({ count: 0 });
    expect(within(dialog).getByRole("button", { name: "Download PDF" })).toBeDisabled();
    for (const box of within(dialog).getAllByRole("checkbox")) {
      if ((box as HTMLInputElement).checked) fireEvent.click(box);
    }
    expect(
      within(dialog).getByText("Choose at least one piece of information."),
    ).toBeVisible();
  });

  it("goes to Google for a sheet", async () => {
    google.mockResolvedValue({ ok: false, code: "googleUnavailable" });
    const dialog = open({
      options: options(true),
      list: "attendance",
      filter: undefined,
    });
    fireEvent.click(within(dialog).getByRole("radio", { name: /Google Sheets/ }));
    expect(within(dialog).getByText(/Only you can open the sheet/)).toBeVisible();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Continue with Google" }),
    );
    expect(google).toHaveBeenCalledWith(
      expect.objectContaining({
        list: "attendance",
        fields: ["fullName", "telegram", "phone"],
      }),
    );
    expect(
      await within(dialog).findByText(
        "Google is not answering right now. Try again shortly.",
      ),
    ).toBeVisible();
  });
});
