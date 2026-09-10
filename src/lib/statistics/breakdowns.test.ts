import { describe, expect, it } from "vitest";

import {
  applicationStatuses,
  submissionTrend,
  vacancyFormats,
  vacancyRegions,
  vacancyStages,
} from "@/lib/statistics/breakdowns";

describe("vacancyStages", () => {
  it("splits draft, published and archived as shares of every vacancy", () => {
    expect(
      vacancyStages([
        {},
        { publishedAt: "2026-01-01T00:00:00Z" },
        { publishedAt: "2026-01-01T00:00:00Z" },
        { publishedAt: "2026-01-01T00:00:00Z", archivedAt: "2026-02-01T00:00:00Z" },
      ]),
    ).toEqual([
      { key: "draft", value: 1, share: 0.25 },
      { key: "published", value: 2, share: 0.5 },
      { key: "archived", value: 1, share: 0.25 },
    ]);
  });

  it("charts nothing when there are no vacancies", () => {
    expect(vacancyStages([])).toEqual([]);
  });
});

describe("vacancyFormats", () => {
  it("scales each format against the commonest one and keeps the listed order", () => {
    expect(
      vacancyFormats([
        { format: "remote" },
        { format: "remote" },
        { format: "onsite" },
      ]),
    ).toEqual([
      { key: "onsite", value: 1, share: 0.5 },
      { key: "remote", value: 2, share: 1 },
    ]);
  });
});

describe("vacancyRegions", () => {
  it("ranks the regions that have vacancies and drops the ones that do not", () => {
    expect(
      vacancyRegions([
        { region: "fergana" },
        { region: "tashkent-city" },
        { region: "tashkent-city" },
        { region: "tashkent-city" },
      ]),
    ).toEqual([
      { key: "tashkent-city", value: 3, share: 1 },
      { key: "fergana", value: 1, share: 1 / 3 },
    ]);
  });

  it("charts nothing when there are no vacancies", () => {
    expect(vacancyRegions([])).toEqual([]);
  });
});

describe("applicationStatuses", () => {
  it("keeps the lifecycle order rather than sorting by size", () => {
    const slices = applicationStatuses([
      { status: "accepted" },
      { status: "accepted" },
      { status: "submitted" },
      { status: "withdrawn" },
    ]);

    expect(slices.map((slice) => slice.key)).toEqual([
      "submitted",
      "accepted",
      "withdrawn",
    ]);
    expect(slices.map((slice) => slice.share)).toEqual([0.5, 1, 0.5]);
  });
});

describe("submissionTrend", () => {
  it("is absent when nothing has been submitted", () => {
    expect(submissionTrend([{}, { submittedAt: "not a date" }])).toBeNull();
  });

  it("spans the first submission to the last, one bucket per day", () => {
    const trend = submissionTrend([
      { submittedAt: "2026-03-01T09:00:00Z" },
      { submittedAt: "2026-03-01T18:00:00Z" },
      { submittedAt: "2026-03-03T10:00:00Z" },
    ]);

    expect(trend?.total).toBe(3);
    expect(trend?.buckets.map((bucket) => bucket.value)).toEqual([2, 0, 1]);
    expect(trend?.buckets.map((bucket) => bucket.share)).toEqual([1, 0, 0.5]);
    expect(trend?.from).toBe("2026-03-01T00:00:00.000Z");
    expect(trend?.to).toBe("2026-03-03T00:00:00.000Z");
  });

  it("widens the bucket so a long span stays readable", () => {
    const trend = submissionTrend([
      { submittedAt: "2026-01-01T00:00:00Z" },
      { submittedAt: "2026-12-31T00:00:00Z" },
    ]);

    expect(trend?.buckets.length).toBeLessThanOrEqual(30);
    expect(trend?.buckets.at(0)?.value).toBe(1);
    expect(trend?.buckets.at(-1)?.value).toBe(1);
  });

  it("counts a submission by its Tashkent day, not its UTC day", () => {
    const trend = submissionTrend([{ submittedAt: "2026-03-01T20:00:00Z" }]);

    expect(trend?.from).toBe("2026-03-02T00:00:00.000Z");
  });
});
