import { describe, expect, it } from "vitest";

import {
  approvalSchema,
  pastEventState,
  rejectionSchema,
  requestChanges,
  requestSubject,
  waitingFirst,
  waitingTotals,
} from "@/lib/past-events/review";
import { pastEventRequestSchema, pastEventSchema } from "@/lib/past-events/schemas";

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

describe("a past event as one decision", () => {
  const counts = (
    pending: number,
    approved: number,
    rejected: number,
    cancelled = 0,
  ) => ({
    participants: pending + approved + rejected + cancelled,
    pending,
    approved,
    rejected,
  });

  it("waits while anyone waits, whatever else was already decided", () => {
    expect(pastEventState(counts(1, 4, 2))).toBe("waiting");
  });

  it("names the outcome once nobody waits", () => {
    expect(pastEventState(counts(0, 3, 0))).toBe("approved");
    expect(pastEventState(counts(0, 2, 1))).toBe("partlyApproved");
    expect(pastEventState(counts(0, 2, 0, 1))).toBe("partlyApproved");
    expect(pastEventState(counts(0, 0, 3))).toBe("rejected");
    expect(pastEventState(counts(0, 0, 1, 2))).toBe("rejected");
    expect(pastEventState(counts(0, 0, 0, 2))).toBe("withdrawn");
  });

  it("totals only the people approve-all would credit, so the prompt states what it does", () => {
    expect(
      waitingTotals([
        request({ hours: 2.25, xpAwarded: 30 }),
        request({ id: "r2", hours: 1.1, xpAwarded: 15 }),
        request({ id: "r3", status: "approved", hours: 9, xpAwarded: 90 }),
        request({ id: "r4", status: "cancelled", hours: 9, xpAwarded: 90 }),
      ]),
    ).toEqual({ people: 2, hours: 3.35, xp: 45 });
  });

  it("puts the people still waiting first, then everyone by name", () => {
    const sorted = waitingFirst([
      request({
        id: "a",
        status: "approved",
        volunteer: { id: "1", displayName: "Aziza", username: "aziza" },
      }),
      request({
        id: "z",
        volunteer: { id: "2", displayName: "Zarina", username: "zarina" },
      }),
      request({
        id: "b",
        volunteer: { id: "3", displayName: null, username: "bobur" },
      }),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(["b", "z", "a"]);
  });

  it("reads an event with its participants and fills counts the API leaves out", () => {
    const event = pastEventSchema.parse({
      id: "p1",
      title: "Book drive",
      eventDate: "2026-09-20",
      createdAt: "2026-10-10T08:00:00.000Z",
      organization: { id: "o1", name: "Readers" },
      participants: 1,
      pending: 1,
      requests: [
        {
          id: "r1",
          rosterId: "p1",
          kind: "create",
          status: "pending",
          title: "Book drive",
          eventDate: "2026-09-20",
          hours: 3,
          xpAwarded: 40,
          createdAt: "2026-10-10T08:00:00.000Z",
          organization: { id: "o1", name: "Readers" },
          volunteer: { id: "v1", displayName: "Aziza", username: "aziza" },
        },
      ],
    });
    expect(event).toMatchObject({ note: null, approved: 0, rejected: 0, cancelled: 0 });
    expect(event.requests[0]?.rosterId).toBe("p1");
  });
});
