import { describe, expect, it } from "vitest";

import {
  activeVacanciesOf,
  byStatus,
  needsReassignment,
  reassignmentCandidates,
  statusOf,
} from "@/lib/coordinators/status";
import type { Coordinator, CoordinatorDetail } from "@/lib/api/schemas";

function coordinator(id: string, status?: string): Coordinator {
  return {
    id,
    displayName: `Coordinator ${id}`,
    email: `${id}@example.org`,
    isActive: status !== "blocked" && status !== "removed",
    createdAt: "2026-09-01T00:00:00.000Z",
    ...(status
      ? {
          coordinatorAccount: {
            userId: id,
            status,
            blockedAt: undefined,
            removedAt: undefined,
          },
        }
      : {}),
  } as Coordinator;
}

const all = [
  coordinator("a", "active"),
  coordinator("b", "blocked"),
  coordinator("c", "removed"),
  coordinator("d", "active"),
];

describe("statusOf", () => {
  it("reads the coordinator account status", () => {
    expect(statusOf(coordinator("b", "blocked"))).toBe("blocked");
  });

  it("treats a missing account as active rather than throwing", () => {
    expect(statusOf(coordinator("x"))).toBe("active");
  });
});

describe("byStatus", () => {
  it("filters to one status", () => {
    expect(byStatus(all, "active").map((item) => item.id)).toEqual(["a", "d"]);
    expect(byStatus(all, "removed").map((item) => item.id)).toEqual(["c"]);
  });

  it("returns everything when no status is chosen", () => {
    expect(byStatus(all, undefined)).toHaveLength(4);
  });
});

describe("removal and reassignment", () => {
  const detail = (vacancies: Array<{ archivedAt?: string }>): CoordinatorDetail =>
    ({
      ...coordinator("a", "active"),
      createdOpportunities: vacancies.map((vacancy, index) => ({
        id: `vac-${index}`,
        slug: `vac-${index}`,
        title: `Vacancy ${index}`,
        status: "open",
        createdAt: "2026-09-01T00:00:00.000Z",
        ...vacancy,
      })),
      auditLogs: [],
    }) as CoordinatorDetail;

  it("counts only vacancies that are not archived as active", () => {
    expect(
      activeVacanciesOf(detail([{}, { archivedAt: "2026-09-02T00:00:00.000Z" }])),
    ).toHaveLength(1);
  });

  it("requires reassignment only while active vacancies remain", () => {
    expect(needsReassignment(detail([{}]))).toBe(true);
    expect(
      needsReassignment(detail([{ archivedAt: "2026-09-02T00:00:00.000Z" }])),
    ).toBe(false);
    expect(needsReassignment(detail([]))).toBe(false);
  });

  it("offers only other active coordinators as the new owner", () => {
    expect(reassignmentCandidates(all, "a").map((item) => item.id)).toEqual(["d"]);
  });
});
