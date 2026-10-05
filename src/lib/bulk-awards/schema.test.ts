import { describe, expect, it } from "vitest";
import { amountErrors, bulkAwardInputSchema } from "./schema";

const id = "00000000-0000-4000-8000-000000000003";
const input = {
  submissionId: id,
  scope: "selected",
  userIds: [id],
  xp: "50",
  hours: "1.25",
  reason: "Community work",
};

describe("bulk awards submitted from the administrator form", () => {
  it("accepts chosen volunteers, and everyone without sending a list of ids", () => {
    expect(bulkAwardInputSchema.safeParse(input).success).toBe(true);
    expect(
      bulkAwardInputSchema.safeParse({ ...input, scope: "all", userIds: [] }).success,
    ).toBe(true);
  });

  it("treats an empty amount as zero so XP or hours can be given alone", () => {
    const parsed = bulkAwardInputSchema.safeParse({ ...input, hours: "" });
    expect(parsed.success && parsed.data.hours).toBe(0);
  });

  it.each([
    { userIds: [] },
    { userIds: [id, id] },
    { scope: "all" },
    { xp: "", hours: "" },
    { xp: "1.1" },
    { hours: "0.001" },
    { hours: "-1" },
    { xp: "100001" },
    { reason: " " },
  ])("refuses an ambiguous award: %j", (change) => {
    expect(bulkAwardInputSchema.safeParse({ ...input, ...change }).success).toBe(false);
  });
});

describe("what the award form tells the administrator before review", () => {
  it("names the field and the reason it cannot be given", () => {
    expect(amountErrors({ xp: "", hours: "", reason: "" })).toEqual({
      xp: "adjustmentEmpty",
      reason: "reasonRequired",
    });
    expect(amountErrors({ xp: "2.5", hours: "1000", reason: "Ok" })).toEqual({
      xp: "amountInvalid",
      hours: "amountTooLarge",
    });
    expect(amountErrors({ xp: "", hours: "3", reason: "Festival" })).toEqual({});
  });
});
