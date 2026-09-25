import { describe, expect, it } from "vitest";

import { sealDate, tashkentDayEnd, tashkentDayStart } from "@/lib/datetime";

describe("Tashkent calendar days", () => {
  it("covers the whole local day, so filtering to a day includes it", () => {
    expect(tashkentDayStart("2026-09-24")).toBe("2026-09-23T19:00:00.000Z");
    expect(tashkentDayEnd("2026-09-24")).toBe("2026-09-24T18:59:59.999Z");
  });

  it("ignores anything that is not a calendar date", () => {
    expect(tashkentDayStart("24/09/2026")).toBeUndefined();
    expect(tashkentDayEnd("")).toBeUndefined();
  });

  it("dates a seal the way the region writes dates", () => {
    expect(sealDate("2026-09-23T20:00:00.000Z")).toBe("24.09.2026");
  });
});
