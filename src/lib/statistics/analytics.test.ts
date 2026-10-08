import { describe, expect, it } from "vitest";
import {
  analyticsDays,
  attendanceRate,
  impactOutcomes,
  type Analytics,
} from "./analytics";

const summary = (
  changes: Partial<Analytics["summary"]> = {},
): Analytics["summary"] => ({
  signups: 0,
  signupAverage: 0,
  signupChange: null,
  activatedSignups: 0,
  applications: 0,
  attended: 0,
  noShow: 0,
  excused: 0,
  cancelled: 0,
  awaiting: 0,
  confirmedHours: 0,
  ...changes,
});

describe("dashboard analytics", () => {
  it("defaults invalid or repeated range values to the allowed 30-day window", () => {
    expect(analyticsDays({})).toBe(30);
    expect(analyticsDays({ days: "365" })).toBe(30);
    expect(analyticsDays({ days: ["90", "30"] })).toBe(90);
  });
  it("excludes unconfirmed, excused and cancelled records from attendance rate", () => {
    expect(
      attendanceRate(
        summary({ attended: 6, noShow: 2, awaiting: 90, excused: 7, cancelled: 3 }),
      ),
    ).toBe(0.75);
    expect(attendanceRate(summary({ awaiting: 5 }))).toBeNull();
  });
  it("keeps a zero outcome at zero length and scales nonzero outcomes together", () => {
    expect(impactOutcomes(summary({ attended: 8, noShow: 2 }))).toEqual([
      { key: "attended", value: 8, share: 1 },
      { key: "noShow", value: 2, share: 0.25 },
      { key: "excused", value: 0, share: 0 },
      { key: "cancelled", value: 0, share: 0 },
      { key: "awaiting", value: 0, share: 0 },
    ]);
  });
});
