import { describe, expect, it } from "vitest";

import {
  attendanceRatio,
  coordinatorSplit,
  pipeline,
  publishedRatio,
} from "@/lib/statistics/charts";
import type { Statistics } from "@/lib/api/schemas";

type Totals = Statistics["totals"];

function totals(overrides: Partial<Totals> = {}): Totals {
  return {
    vacancies: 0,
    publishedVacancies: 0,
    pendingApproval: 0,
    changesRequested: 0,
    applications: 0,
    pendingReview: 0,
    accepted: 0,
    awaitingAttendance: 0,
    attendanceDue: 0,
    attended: 0,
    confirmedHours: 0,
    ...overrides,
  };
}

describe("pipeline", () => {
  it("keeps the stages in the order an application moves through them", () => {
    const stages = pipeline(totals());

    expect(stages.map((stage) => stage.key)).toEqual([
      "applications",
      "pendingReview",
      "accepted",
      "awaitingAttendance",
      "attended",
    ]);
  });

  it("scales every stage against the tallest one, not against the first", () => {
    const stages = pipeline(
      totals({
        applications: 40,
        pendingReview: 10,
        accepted: 20,
        awaitingAttendance: 5,
        attended: 15,
      }),
    );

    expect(stages.map((stage) => stage.share)).toEqual([1, 0.25, 0.5, 0.125, 0.375]);
  });

  it("gives every stage a zero share when nothing has been counted", () => {
    expect(pipeline(totals()).every((stage) => stage.share === 0)).toBe(true);
  });

  it("reads a negative count as nothing rather than inverting the bar", () => {
    const stages = pipeline(totals({ applications: 10, pendingReview: -4 }));

    expect(stages[1]).toEqual({ key: "pendingReview", value: 0, share: 0 });
  });
});

describe("publishedRatio", () => {
  it("reports the published vacancies as a share of every vacancy", () => {
    expect(publishedRatio(totals({ vacancies: 8, publishedVacancies: 6 }))).toEqual({
      value: 6,
      total: 8,
      share: 0.75,
    });
  });

  it("never claims more published vacancies than there are vacancies", () => {
    expect(publishedRatio(totals({ vacancies: 2, publishedVacancies: 5 }))).toEqual({
      value: 2,
      total: 2,
      share: 1,
    });
  });

  it("does not divide by zero when there are no vacancies", () => {
    expect(publishedRatio(totals())).toEqual({ value: 0, total: 0, share: 0 });
  });
});

describe("attendanceRatio", () => {
  it("measures confirmed attendance against every attendance record", () => {
    expect(attendanceRatio(totals({ attended: 9, awaitingAttendance: 3 }))).toEqual({
      value: 9,
      total: 12,
      share: 0.75,
    });
  });

  it("does not divide by zero when no attendance has been recorded", () => {
    expect(attendanceRatio(totals())).toEqual({ value: 0, total: 0, share: 0 });
  });
});

describe("coordinatorSplit", () => {
  it("is absent when the API did not send a coordinator breakdown", () => {
    expect(coordinatorSplit(totals())).toBeNull();
  });

  it("is absent when the breakdown counts nobody", () => {
    expect(
      coordinatorSplit(totals({ coordinators: { active: 0, blocked: 0, removed: 0 } })),
    ).toBeNull();
  });

  it("splits the segments so the shares add up to the whole bar", () => {
    const segments = coordinatorSplit(
      totals({ coordinators: { active: 6, blocked: 2, removed: 2 } }),
    );

    expect(segments).toEqual([
      { key: "active", value: 6, share: 0.6 },
      { key: "blocked", value: 2, share: 0.2 },
      { key: "removed", value: 2, share: 0.2 },
    ]);
  });
});
