import { describe, expect, it } from "vitest";

import {
  approvalSchema,
  rejectionSchema,
  requestChanges,
  requestSubject,
} from "@/lib/past-events/review";
import { pastEventRequestSchema } from "@/lib/past-events/schemas";

function request(overrides: Record<string, unknown> = {}) {
  return pastEventRequestSchema.parse({
    id: "r1",
    kind: "create",
    status: "pending",
    title: "Book drive",
    eventDate: "2026-09-20",
    hours: 3,
    xpAwarded: 40,
    createdAt: "2026-10-10T08:00:00.000Z",
    organization: { id: "o1", name: "Readers" },
    volunteer: { id: "v1", displayName: "Aziza", username: "aziza" },
    ...overrides,
  });
}

const recorded = {
  id: "e1",
  title: "Book drive",
  eventDate: "2026-09-20",
  hours: 3,
  xpAwarded: 40,
};

describe("past event review", () => {
  it("lists only what a correction would change", () => {
    const correction = request({
      kind: "update",
      hours: 5,
      xpAwarded: 60,
      event: recorded,
    });

    expect(requestChanges(correction)).toEqual([
      { field: "hours", from: 3, to: 5 },
      { field: "xpAwarded", from: 40, to: 60 },
    ]);
    expect(requestChanges(request())).toEqual([]);
  });

  it("names a removal after the event it removes", () => {
    const removal = request({
      kind: "remove",
      title: null,
      eventDate: null,
      hours: null,
      xpAwarded: null,
      event: { ...recorded, title: "City cleanup" },
    });

    expect(requestSubject(removal)).toBe("City cleanup");
    expect(requestChanges(removal)).toEqual([]);
  });

  it("starts a request without evidence at zero rather than guessing", () => {
    expect(request().participation).toEqual({
      attendedEvents: 0,
      attendedHours: 0,
      pastEvents: 0,
    });
  });

  it("accepts corrected hours and XP in the backend's ranges only", () => {
    expect(approvalSchema.parse({ hours: "2.5", xpAwarded: "25" })).toEqual({
      hours: 2.5,
      xpAwarded: 25,
    });
    for (const input of [
      { hours: "2.555", xpAwarded: "25" },
      { hours: "-1", xpAwarded: "25" },
      { hours: "2", xpAwarded: "2.5" },
      { hours: "2", xpAwarded: "100001" },
    ]) {
      expect(approvalSchema.safeParse(input).success).toBe(false);
    }
  });

  it("does not reject without a reason", () => {
    expect(rejectionSchema.safeParse({ note: "   " }).success).toBe(false);
    expect(rejectionSchema.parse({ note: " Not this organization's event " })).toEqual({
      note: "Not this organization's event",
    });
  });
});
