import { describe, expect, it } from "vitest";
import { signupTrendSchema } from "./signup-trend";

it("accepts an empty population without fabricating a chart", () => {
  expect(signupTrendSchema.parse({ trend: null })).toEqual({ trend: null });
});

describe("signup trend contract", () => {
  const bucket = { start: "2026-01-01T00:00:00.000Z", value: 2500, share: 1 };
  const trend = {
    from: bucket.start,
    to: bucket.start,
    total: 2500,
    peak: 2500,
    buckets: [bucket],
  };
  it("accepts aggregate totals above the old directory scan cap", () => {
    expect(signupTrendSchema.parse({ trend }).trend?.total).toBe(2500);
  });
  it("rejects unbounded buckets and invalid shares", () => {
    expect(
      signupTrendSchema.safeParse({
        trend: { ...trend, buckets: Array(31).fill(bucket) },
      }).success,
    ).toBe(false);
    expect(
      signupTrendSchema.safeParse({
        trend: { ...trend, buckets: [{ ...bucket, share: 2 }] },
      }).success,
    ).toBe(false);
  });
});
