import { describe, expect, it } from "vitest";

import { tashkentDayEnd, tashkentDayStart, waited } from "@/lib/datetime";

describe("Tashkent calendar days", () => {
  it("covers the whole local day, so filtering to a day includes it", () => {
    expect(tashkentDayStart("2026-09-24")).toBe("2026-09-23T19:00:00.000Z");
    expect(tashkentDayEnd("2026-09-24")).toBe("2026-09-24T18:59:59.999Z");
  });

  it("ignores anything that is not a calendar date", () => {
    expect(tashkentDayStart("24/09/2026")).toBeUndefined();
    expect(tashkentDayEnd("")).toBeUndefined();
  });
});

describe("how long something has waited", () => {
  const now = new Date("2026-11-02T12:00:00.000Z");

  it("counts a wait under a day in hours, so a fresh item never reads as zero days", () => {
    expect(waited("2026-11-02T11:30:00.000Z", now)).toMatchObject({
      unit: "hour",
      value: 1,
    });
    expect(waited("2026-11-02T02:00:00.000Z", now)).toMatchObject({
      unit: "hour",
      value: 10,
    });
  });

  it("switches to whole days after a day and to whole weeks after two weeks", () => {
    expect(waited("2026-10-29T00:00:00.000Z", now)).toMatchObject({
      unit: "day",
      value: 4,
    });
    expect(waited("2026-10-13T12:00:00.000Z", now)).toMatchObject({
      unit: "week",
      value: 2,
    });
  });

  it("keeps the exact length in days so ages can share one scale", () => {
    expect(waited("2026-10-31T12:00:00.000Z", now)?.days).toBe(2);
  });

  it("returns nothing for a missing or unreadable timestamp rather than inventing an age", () => {
    expect(waited(undefined, now)).toBeNull();
    expect(waited("not a date", now)).toBeNull();
  });
});
