import { describe, expect, it } from "vitest";

import { applicationSchema } from "@/lib/api/schemas";
import { completionShare, participationOf } from "@/lib/users/participation";

function application(overrides: Record<string, unknown>) {
  return applicationSchema.parse({
    id: String(Math.random()),
    status: "accepted",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    volunteerId: "volunteer-1",
    opportunityId: "vacancy-1",
    ...overrides,
  });
}

describe("a volunteer's participation", () => {
  it("counts attended events and confirmed hours, never unconfirmed ones", () => {
    expect(
      participationOf([
        application({
          attendance: { id: "a", outcome: "attended", confirmedHours: 4.5 },
        }),
        application({
          attendance: { id: "b", outcome: "attended", confirmedHours: 2 },
        }),
        application({ attendance: { id: "c", outcome: "awaiting_confirmation" } }),
        application({ attendance: { id: "d", outcome: "excused" } }),
        application({ status: "rejected" }),
      ]),
    ).toEqual({ sent: 5, accepted: 4, attended: 2, hours: 6.5, awaiting: 1 });
  });

  it("measures the profile against everything applying needs", () => {
    expect(completionShare([])).toBe(1);
    expect(completionShare(["phone", "telegram"])).toBeCloseTo(0.8);
  });
});
