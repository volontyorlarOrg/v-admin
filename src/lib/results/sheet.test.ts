import { describe, expect, it } from "vitest";

import type { SheetRow, XpRules } from "@/lib/results/schemas";
import {
  changedEntries,
  differsFromVerified,
  editableRow,
  parseHours,
  previewXp,
  rowProblem,
  summarise,
  toEntry,
  type EditableRow,
} from "@/lib/results/sheet";

const RULES: XpRules = {
  xpPerHour: 10,
  xpWinner: 50,
  xpContributor: 30,
  xpAttendee: 10,
  xpNoShowPenalty: 10,
};

function sheetRow(overrides: Partial<SheetRow> = {}): SheetRow {
  return {
    applicationId: "application",
    attendanceId: "attendance",
    submittedAt: null,
    volunteer: { id: "v", displayName: "Rano", username: "rano.k", avatarUrl: null },
    verified: {
      outcome: "awaiting_confirmation",
      hours: null,
      placement: null,
      note: null,
      xpAwarded: 0,
      resolvedAt: null,
    },
    draft: null,
    reviewNote: null,
    ...overrides,
  };
}

function row(overrides: Partial<EditableRow> = {}): EditableRow {
  return {
    applicationId: "application",
    outcome: "attended",
    hours: "12",
    placement: null,
    note: "",
    ...overrides,
  };
}

describe("attendance sheet rows", () => {
  it("starts from the draft and falls back to the verified result", () => {
    expect(editableRow(sheetRow())).toMatchObject({ outcome: null, hours: "" });
    expect(
      editableRow(
        sheetRow({
          draft: { outcome: "attended", hours: 10, placement: null, note: "Late" },
        }),
      ),
    ).toMatchObject({ outcome: "attended", hours: "10", note: "Late" });
  });

  it("reads hours with a comma or a point and refuses finer than hundredths", () => {
    expect(parseHours("7,5")).toBe(7.5);
    expect(parseHours(" 12 ")).toBe(12);
    expect(parseHours("")).toBeNull();
    expect(parseHours("1.125")).toBeNaN();
    expect(parseHours("abc")).toBeNaN();
  });

  it("names what still blocks a row", () => {
    expect(rowProblem(row({ outcome: null }), "volunteering")).toBe("outcomeRequired");
    expect(rowProblem(row({ hours: "" }), "volunteering")).toBe("hoursRequired");
    expect(rowProblem(row({ hours: "0.1" }), "volunteering")).toBe("hoursInvalid");
    expect(rowProblem(row({ hours: "" }), "competition")).toBeNull();
    expect(
      rowProblem(row({ outcome: "excused", hours: "" }), "volunteering"),
    ).toBeNull();
  });

  it("previews the XP the backend will award", () => {
    expect(previewXp(RULES, "volunteering", row())).toBe(120);
    expect(previewXp(RULES, "volunteering", row({ outcome: "no_show" }))).toBe(-10);
    expect(previewXp(RULES, "volunteering", row({ outcome: "excused" }))).toBe(0);
    expect(previewXp(RULES, "volunteering", row({ outcome: null }))).toBeNull();
    expect(
      previewXp(RULES, "competition", row({ placement: "winner", hours: "" })),
    ).toBe(50);
    expect(previewXp(RULES, "competition", row({ placement: null, hours: "" }))).toBe(
      10,
    );
  });

  it("sends hours only for attended volunteering and a placement only for competitions", () => {
    expect(toEntry(row({ placement: "winner" }), "volunteering")).toEqual({
      applicationId: "application",
      outcome: "attended",
      hours: 12,
      placement: null,
      note: null,
    });
    expect(toEntry(row({ hours: "4" }), "competition")).toMatchObject({
      hours: null,
      placement: "attendee",
    });
    expect(toEntry(row({ outcome: null }), "volunteering")).toEqual({
      applicationId: "application",
      outcome: null,
    });
  });

  it("sends only the rows that changed", () => {
    const saved = [
      row(),
      row({ applicationId: "other", outcome: "excused", hours: "" }),
    ];
    const edited = [
      row({ hours: "12 " }),
      row({ applicationId: "other", outcome: "no_show", hours: "" }),
    ];

    expect(changedEntries(edited, saved, "volunteering")).toEqual([
      {
        applicationId: "other",
        outcome: "no_show",
        hours: null,
        placement: null,
        note: null,
      },
    ]);
  });

  it("totals outcomes, hours, XP and problems", () => {
    expect(
      summarise(
        [
          row(),
          row({ hours: "6" }),
          row({ outcome: "no_show", hours: "" }),
          row({ outcome: "excused", hours: "" }),
          row({ outcome: null, hours: "" }),
        ],
        "volunteering",
        RULES,
      ),
    ).toEqual({
      total: 5,
      attended: 2,
      excused: 1,
      noShow: 1,
      cancelled: 0,
      undecided: 1,
      hours: 18,
      xp: 170,
      problems: 1,
    });
  });

  it("tells a correction apart from an untouched verified row", () => {
    const verified = {
      outcome: "attended" as const,
      hours: 4,
      placement: null,
      note: null,
      xpAwarded: 90,
      resolvedAt: "2026-09-30T05:24:00.000Z",
    };
    expect(differsFromVerified(sheetRow({ verified }))).toBe(false);
    expect(
      differsFromVerified(
        sheetRow({
          verified,
          draft: { outcome: "attended", hours: 6, placement: null, note: null },
        }),
      ),
    ).toBe(true);
  });
});
