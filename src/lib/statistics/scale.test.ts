import { describe, expect, it } from "vitest";

import { change, linearScale, tickIndexes } from "@/lib/statistics/scale";

describe("linearScale", () => {
  it("starts a column axis at zero and rounds its top up to a clean tick", () => {
    expect(linearScale([0, 3, 6])).toEqual({ min: 0, max: 6, ticks: [0, 2, 4, 6] });
    expect(linearScale([0, 37, 12])).toEqual({
      min: 0,
      max: 40,
      ticks: [0, 10, 20, 30, 40],
    });
  });

  it("draws a single zero tick for an all-zero range instead of a 0 to 0 axis", () => {
    expect(linearScale([0, 0, 0])).toEqual({ min: 0, max: 1, ticks: [0] });
  });

  it("never splits a count into fractional ticks", () => {
    expect(linearScale([0, 1, 2]).ticks).toEqual([0, 1, 2]);
  });

  it("allows fractional ticks for hours", () => {
    expect(linearScale([0, 1.5], { integer: false }).ticks).toEqual([0, 0.5, 1, 1.5]);
  });

  it("lets a cumulative line start near its lowest value so growth stays visible", () => {
    expect(linearScale([1200, 1230, 1260], { zero: false })).toEqual({
      min: 1200,
      max: 1260,
      ticks: [1200, 1220, 1240, 1260],
    });
  });

  it("frames a flat line one step either side so no change reads as no change", () => {
    expect(linearScale([5, 5, 5], { zero: false })).toEqual({
      min: 4,
      max: 6,
      ticks: [4, 5, 6],
    });
  });
});

describe("tickIndexes", () => {
  it("spreads date labels evenly and always includes both ends", () => {
    expect(tickIndexes(30, 5)).toEqual([0, 7, 15, 22, 29]);
    expect(tickIndexes(1)).toEqual([0]);
    expect(tickIndexes(0)).toEqual([]);
  });
});

describe("change", () => {
  it("compares with the previous period as a share of it", () => {
    expect(change(12, 10)).toBeCloseTo(0.2);
    expect(change(5, 10)).toBeCloseTo(-0.5);
  });

  it("returns nothing when there is no previous baseline, never an infinite percentage", () => {
    expect(change(4, 0)).toBeNull();
  });
});
