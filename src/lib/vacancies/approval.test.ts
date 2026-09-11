import { describe, expect, it } from "vitest";

import {
  approvalStatusOf,
  attendanceOpensAt,
  canApproveVacancy,
  canEditVacancy,
  canRejectVacancy,
  canRequestVacancyChanges,
  canSubmitForApproval,
  hasMeetingCredentials,
  isAttendanceOpen,
  missingForApproval,
  vacancyStateOf,
  type ApprovalCandidate,
} from "@/lib/vacancies/approval";

const ready: ApprovalCandidate = {
  title: "Winter book drive",
  summary: "Collect and sort books.",
  description: "A longer description of the work.",
  format: "onsite",
  region: "tashkent-city",
  city: "Tashkent",
  locationName: "Chilonzor library",
  startsAt: "2026-10-01T09:00:00.000Z",
  endsAt: "2026-10-01T15:00:00.000Z",
  applicationDeadline: "2026-09-20T18:00:00.000Z",
  capacity: 20,
  estimatedTotalHours: 6,
  organization: { verified: true },
};

describe("approvalStatusOf", () => {
  it("reads the status the API sends when it sends one", () => {
    expect(approvalStatusOf({ approvalStatus: "pending_review" })).toBe(
      "pending_review",
    );
  });

  it("treats a vacancy published before the workflow existed as approved", () => {
    expect(approvalStatusOf({ publishedAt: "2026-01-01T00:00:00.000Z" })).toBe(
      "approved",
    );
  });

  it("treats an unpublished vacancy from before the workflow as a draft", () => {
    expect(approvalStatusOf({})).toBe("draft");
  });
});

describe("vacancyStateOf", () => {
  it("reports an archived vacancy as archived whatever its approval was", () => {
    expect(
      vacancyStateOf({
        approvalStatus: "approved",
        archivedAt: "2026-02-01T00:00:00.000Z",
      }),
    ).toBe("archived");
  });
});

describe("what a coordinator may do", () => {
  it("submits a draft and a vacancy that came back for changes", () => {
    expect(canSubmitForApproval({ approvalStatus: "draft" })).toBe(true);
    expect(canSubmitForApproval({ approvalStatus: "changes_requested" })).toBe(true);
    expect(canSubmitForApproval({ approvalStatus: "pending_review" })).toBe(false);
    expect(canSubmitForApproval({ approvalStatus: "rejected" })).toBe(false);
    expect(canSubmitForApproval({ approvalStatus: "approved" })).toBe(false);
  });

  it("locks a vacancy while an administrator is looking at it", () => {
    expect(canEditVacancy({ approvalStatus: "pending_review" })).toBe(false);
  });

  it("keeps a rejected vacancy read-only for good", () => {
    expect(canEditVacancy({ approvalStatus: "rejected" })).toBe(false);
    expect(canSubmitForApproval({ approvalStatus: "rejected" })).toBe(false);
  });

  it("reopens editing after changes are requested", () => {
    expect(canEditVacancy({ approvalStatus: "changes_requested" })).toBe(true);
  });

  it("stops editing once archived", () => {
    expect(
      canEditVacancy({
        approvalStatus: "approved",
        archivedAt: "2026-02-01T00:00:00.000Z",
      }),
    ).toBe(false);
  });
});

describe("what an administrator may do", () => {
  it("decides only a vacancy waiting for review", () => {
    expect(canRequestVacancyChanges({ approvalStatus: "pending_review" })).toBe(true);
    expect(canRejectVacancy({ approvalStatus: "pending_review" })).toBe(true);
    expect(canRequestVacancyChanges({ approvalStatus: "draft" })).toBe(false);
    expect(canRejectVacancy({ approvalStatus: "approved" })).toBe(false);
  });

  it("approves only after the draft has entered review", () => {
    expect(canApproveVacancy({ approvalStatus: "draft" })).toBe(false);
    expect(canApproveVacancy({ approvalStatus: "pending_review" })).toBe(true);
    expect(canApproveVacancy({ approvalStatus: "approved" })).toBe(false);
    expect(canApproveVacancy({ approvalStatus: "rejected" })).toBe(false);
  });
});

describe("missingForApproval", () => {
  it("passes a vacancy that carries everything approval needs", () => {
    expect(missingForApproval(ready)).toEqual([]);
  });

  it("refuses a vacancy whose organization is not verified", () => {
    expect(
      missingForApproval({ ...ready, organization: { verified: false } }),
    ).toContain("organization");
  });

  it("requires an end, so attendance has a moment it can open", () => {
    expect(missingForApproval({ ...ready, endsAt: undefined })).toContain("endsAt");
  });

  it("refuses a deadline that has already passed, as the API does", () => {
    expect(missingForApproval(ready, new Date("2026-09-21T00:00:00.000Z"))).toContain(
      "applicationDeadline",
    );
    expect(missingForApproval(ready, new Date("2026-09-19T00:00:00.000Z"))).toEqual([]);
  });

  it("requires the deadline to fall before the vacancy starts", () => {
    for (const applicationDeadline of [
      "2026-10-01T09:00:00.000Z",
      "2026-10-02T18:00:00.000Z",
    ]) {
      expect(missingForApproval({ ...ready, applicationDeadline })).toContain(
        "applicationDeadline",
      );
    }
  });

  it("requires a positive whole number of places", () => {
    expect(missingForApproval({ ...ready, capacity: 0 })).toContain("capacity");
    expect(missingForApproval({ ...ready, capacity: undefined })).toContain("capacity");
  });

  it("requires positive estimated hours for the whole event", () => {
    expect(missingForApproval({ ...ready, estimatedTotalHours: 0 })).toContain(
      "estimatedTotalHours",
    );
  });

  it("requires a city and a venue on site and in a hybrid", () => {
    expect(missingForApproval({ ...ready, city: undefined })).toContain("location");
    expect(
      missingForApproval({ ...ready, format: "hybrid", locationName: undefined }),
    ).toContain("location");
  });

  it("requires a named online location when the work is remote", () => {
    expect(
      missingForApproval({
        ...ready,
        format: "remote",
        city: undefined,
        locationName: undefined,
      }),
    ).toContain("location");
    expect(
      missingForApproval({
        ...ready,
        format: "remote",
        city: undefined,
        locationName: "Public briefing stream, link sent on the day",
      }),
    ).toEqual([]);
  });
});

describe("hasMeetingCredentials", () => {
  it("catches a passcode a coordinator pasted into a public field", () => {
    expect(hasMeetingCredentials("Zoom, passcode 4821")).toBe(true);
    expect(hasMeetingCredentials("https://meet.example.org/x?pwd=abc")).toBe(true);
    expect(hasMeetingCredentials("Parol: 1234")).toBe(true);
    expect(hasMeetingCredentials("Пароль 55")).toBe(true);
  });

  it("leaves an ordinary online description alone", () => {
    expect(hasMeetingCredentials("Online briefing, link sent on the day")).toBe(false);
  });
});

describe("when attendance opens", () => {
  it("opens when the event ends", () => {
    expect(attendanceOpensAt(ready)?.toISOString()).toBe("2026-10-01T15:00:00.000Z");
  });

  it("falls back to the start for a legacy record with no end", () => {
    expect(attendanceOpensAt({ startsAt: ready.startsAt })?.toISOString()).toBe(
      "2026-10-01T09:00:00.000Z",
    );
  });

  it("stays shut until that moment has passed", () => {
    expect(isAttendanceOpen(ready, new Date("2026-10-01T14:59:00.000Z"))).toBe(false);
    expect(isAttendanceOpen(ready, new Date("2026-10-01T15:00:00.000Z"))).toBe(true);
  });
});
