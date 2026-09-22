import { describe, expect, it } from "vitest";

import {
  acceptedApplications,
  isAttendanceResolved,
  searchApplications,
  sortApplications,
  unresolvedFirst,
  volunteerNameOf,
} from "@/lib/applications/filters";
import type { Application } from "@/lib/api/schemas";

function application(overrides: Partial<Application> & { id: string }): Application {
  return {
    status: "submitted",
    createdAt: "2026-09-01T09:00:00.000Z",
    updatedAt: "2026-09-01T09:00:00.000Z",
    volunteerId: "vol-1",
    opportunityId: "vac-1",
    answers: [],
    ...overrides,
  } as Application;
}

describe("volunteerNameOf", () => {
  it("prefers the snapshot taken when the application was submitted", () => {
    expect(
      volunteerNameOf(
        application({
          id: "a",
          profileSnapshot: { fullName: "Dilnoza Karimova" },
          volunteer: { id: "vol-1", displayName: "Someone Else" },
        }),
      ),
    ).toBe("Dilnoza Karimova");
  });

  it("falls back to the live profile, then the display name", () => {
    expect(
      volunteerNameOf(
        application({
          id: "a",
          volunteer: { id: "vol-1", profile: { fullName: "Aziza Nazarova" } },
        }),
      ),
    ).toBe("Aziza Nazarova");

    expect(
      volunteerNameOf(
        application({ id: "a", volunteer: { id: "vol-1", displayName: "Jasur" } }),
      ),
    ).toBe("Jasur");
  });

  it("is empty rather than a placeholder when nothing is known", () => {
    expect(volunteerNameOf(application({ id: "a" }))).toBe("");
  });
});

describe("searchApplications", () => {
  const items = [
    application({
      id: "a",
      profileSnapshot: { fullName: "Dilnoza Karimova" },
      opportunity: {
        id: "vac-1",
        slug: "book-drive",
        title: "Winter book drive",
        essayRequired: false,
      },
    }),
    application({
      id: "b",
      profileSnapshot: { fullName: "Sardor Toshmatov" },
      opportunity: {
        id: "vac-2",
        slug: "sports",
        title: "City sports day",
        essayRequired: false,
      },
    }),
  ];

  it("matches a volunteer name or a vacancy title", () => {
    expect(searchApplications(items, "dilnoza").map((item) => item.id)).toEqual(["a"]);
    expect(searchApplications(items, "sports").map((item) => item.id)).toEqual(["b"]);
  });

  it("returns everything for an empty term", () => {
    expect(searchApplications(items, "  ")).toHaveLength(2);
  });
});

describe("sortApplications", () => {
  it("puts the longest-waiting application first", () => {
    const items = [
      application({ id: "new", submittedAt: "2026-09-05T00:00:00.000Z" }),
      application({ id: "old", submittedAt: "2026-09-01T00:00:00.000Z" }),
    ];

    expect(sortApplications(items).map((item) => item.id)).toEqual(["old", "new"]);
  });

  it("falls back to the creation time for an application never submitted", () => {
    const items = [
      application({ id: "b", createdAt: "2026-09-04T00:00:00.000Z" }),
      application({ id: "a", createdAt: "2026-09-02T00:00:00.000Z" }),
    ];

    expect(sortApplications(items).map((item) => item.id)).toEqual(["a", "b"]);
  });
});

describe("acceptedApplications and unresolvedFirst", () => {
  const attendance = (outcome: string) => ({
    id: "att",
    outcome,
    applicationId: "x",
    volunteerId: "v",
    opportunityId: "o",
  });

  const items = [
    application({
      id: "resolved",
      status: "accepted",
      attendance: attendance("attended") as never,
    }),
    application({ id: "open", status: "accepted" }),
    application({ id: "rejected", status: "rejected" }),
  ];

  it("keeps only accepted applications, because only they earn attendance", () => {
    expect(acceptedApplications(items).map((item) => item.id)).toEqual([
      "resolved",
      "open",
    ]);
  });

  it("puts the undecided ones first, and keeps the decided ones on the page", () => {
    expect(unresolvedFirst(acceptedApplications(items)).map((item) => item.id)).toEqual(
      ["open", "resolved"],
    );
  });

  it("reads a resolved outcome from the attendance record", () => {
    expect(isAttendanceResolved(items[0]!)).toBe(true);
    expect(isAttendanceResolved(items[1]!)).toBe(false);
  });
});
