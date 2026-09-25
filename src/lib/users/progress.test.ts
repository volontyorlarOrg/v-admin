import { describe, expect, it } from "vitest";

import {
  progressAdjustmentOf,
  progressValuesOf,
  signedChange,
} from "@/lib/users/progress";

const valid = { direction: "add", xp: "40", hours: "2.5", reason: "Office help" };

describe("an XP and hours adjustment", () => {
  it("sends positive changes when the administrator adds", () => {
    expect(progressAdjustmentOf(valid)).toEqual({
      body: { xpDelta: 40, hoursDelta: 2.5, reason: "Office help" },
    });
  });

  it("turns both amounts negative when the administrator takes away", () => {
    expect(progressAdjustmentOf({ ...valid, direction: "remove" })).toEqual({
      body: { xpDelta: -40, hoursDelta: -2.5, reason: "Office help" },
    });
  });

  it("treats an empty amount as no change to that number", () => {
    expect(
      progressAdjustmentOf({ ...valid, direction: "remove", hours: "  " }),
    ).toEqual({ body: { xpDelta: -40, hoursDelta: 0, reason: "Office help" } });
  });

  it("refuses an adjustment that changes nothing, as the backend would", () => {
    expect(progressAdjustmentOf({ ...valid, xp: "0", hours: "" })).toEqual({
      result: { status: "error", code: "adjustmentEmpty", fields: {} },
    });
  });

  it.each([
    ["fractional XP", { xp: "2.5" }, "xp", "xpAmount"],
    ["a minus sign, which the direction already says", { xp: "-5" }, "xp", "xpAmount"],
    ["more XP than one change allows", { xp: "100001" }, "xp", "xpAmount"],
    ["hours finer than hundredths", { hours: "0.125" }, "hours", "hoursAmount"],
    ["text in place of hours", { hours: "two" }, "hours", "hoursAmount"],
    ["more hours than one change allows", { hours: "1000" }, "hours", "hoursAmount"],
    ["a blank reason", { reason: "   " }, "reason", "required"],
    ["a reason past 500 characters", { reason: "x".repeat(501) }, "reason", "tooLong"],
    ["no direction", { direction: "" }, "direction", "required"],
  ])("flags %s on its own field", (_label, change, field, code) => {
    expect(progressAdjustmentOf({ ...valid, ...change })).toEqual({
      result: {
        status: "error",
        code: "validationFailed",
        fields: { [field]: [code] },
      },
    });
  });

  it("accepts hundredths of an hour", () => {
    expect(progressAdjustmentOf({ ...valid, xp: "", hours: "0.1" })).toEqual({
      body: { xpDelta: 0, hoursDelta: 0.1, reason: "Office help" },
    });
  });

  it("reads only the adjustment's own fields from the form", () => {
    const form = new FormData();
    form.set("id", "volunteer-1");
    form.set("direction", "add");
    form.set("xp", "10");
    form.set("reason", "Bonus");

    expect(progressValuesOf(form)).toEqual({
      direction: "add",
      xp: "10",
      hours: "",
      reason: "Bonus",
    });
  });
});

describe("a signed change in the history", () => {
  const format = (value: number) => value.toLocaleString("en");

  it("marks additions with a plus and reductions with a true minus", () => {
    expect(signedChange(1500, format)).toBe("+1,500");
    expect(signedChange(-2.5, format)).toBe("−2.5");
  });

  it("shows a dash when that number did not change", () => {
    expect(signedChange(0, format)).toBe("—");
  });
});
