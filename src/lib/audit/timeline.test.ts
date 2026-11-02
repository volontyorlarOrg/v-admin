import { describe, expect, it } from "vitest";

import type { AuditEvent } from "@/lib/api/schemas";
import { detailsOf, groupByDay, rangeDays } from "@/lib/audit/timeline";

function event(
  id: string,
  createdAt: string,
  action = "opportunity.updated",
): AuditEvent {
  return { id, action, entityType: "Opportunity", entityId: "v", createdAt };
}

describe("groupByDay", () => {
  it("groups by the Tashkent calendar day, newest day and newest event first", () => {
    const days = groupByDay([
      event("a", "2026-11-01T10:00:00.000Z"),
      event("b", "2026-11-01T19:30:00.000Z"),
      event("c", "2026-11-01T18:30:00.000Z"),
      event("d", "2026-10-30T09:00:00.000Z"),
    ]);
    expect(days.map((day) => [day.day, day.events.map((item) => item.id)])).toEqual([
      ["2026-11-02", ["b"]],
      ["2026-11-01", ["c", "a"]],
      ["2026-10-30", ["d"]],
    ]);
  });

  it("is empty for an empty page", () => {
    expect(groupByDay([])).toEqual([]);
  });
});

describe("detailsOf", () => {
  it("names an attendance outcome", () => {
    expect(
      detailsOf({ action: "attendance.resolved", metadata: { outcome: "no_show" } }),
    ).toEqual([{ kind: "outcome", outcome: "no_show" }]);
  });

  it("explains an application closed by archiving its vacancy", () => {
    expect(
      detailsOf({
        action: "application.closed",
        metadata: { reason: "opportunity.archived" },
      }),
    ).toEqual([{ kind: "closedByArchive" }]);
  });

  it("marks an automatic acceptance and a handed-over removal", () => {
    expect(
      detailsOf({ action: "application.accepted", metadata: { automatic: true } }),
    ).toEqual([{ kind: "automatic" }]);
    expect(
      detailsOf({
        action: "coordinator.removed",
        metadata: { reassignToCoordinatorId: "c2" },
      }),
    ).toEqual([{ kind: "reassigned" }]);
  });

  it("shows nothing it does not understand, never the raw metadata", () => {
    expect(
      detailsOf({ action: "opportunity.updated", metadata: { secret: "x" } }),
    ).toEqual([]);
    expect(
      detailsOf({ action: "attendance.resolved", metadata: ["attended"] }),
    ).toEqual([]);
    expect(detailsOf({ action: "attendance.resolved" })).toEqual([]);
  });
});

describe("rangeDays", () => {
  const now = new Date("2026-11-01T20:00:00.000Z");

  it("starts today in Tashkent, not in UTC", () => {
    expect(rangeDays("today", now)).toEqual({ from: "2026-11-02", to: "2026-11-02" });
  });

  it("counts today inside a week and a month", () => {
    expect(rangeDays("week", now)).toEqual({ from: "2026-10-27", to: "2026-11-02" });
    expect(rangeDays("month", now)).toEqual({ from: "2026-10-04", to: "2026-11-02" });
  });
});
