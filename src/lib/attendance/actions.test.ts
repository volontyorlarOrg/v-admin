import { describe, expect, it } from "vitest";

import { fieldErrorsOf } from "@/lib/auth/credentials";
import { resolveAttendanceSchema } from "@/lib/attendance/schema";

describe("resolveAttendanceSchema", () => {
  it("accepts attendance with confirmed hours", () => {
    expect(
      resolveAttendanceSchema.safeParse({ outcome: "attended", confirmedHours: "4" })
        .success,
    ).toBe(true);
  });

  it("requires hours when the volunteer attended", () => {
    const result = resolveAttendanceSchema.safeParse({ outcome: "attended" });
    expect(fieldErrorsOf(result.error!).confirmedHours).toEqual([
      "confirmedHoursRequired",
    ]);
  });

  it("does not ask for hours when the event was excused or cancelled", () => {
    expect(resolveAttendanceSchema.safeParse({ outcome: "excused" }).success).toBe(
      true,
    );
    expect(resolveAttendanceSchema.safeParse({ outcome: "cancelled" }).success).toBe(
      true,
    );
  });

  it("refuses to leave attendance unresolved", () => {
    expect(
      resolveAttendanceSchema.safeParse({ outcome: "awaiting_confirmation" }).success,
    ).toBe(false);
  });

  it("refuses hours outside what the backend accepts", () => {
    for (const confirmedHours of ["-1", "1000", "many"]) {
      const result = resolveAttendanceSchema.safeParse({
        outcome: "attended",
        confirmedHours,
      });
      expect(fieldErrorsOf(result.error!).confirmedHours, confirmedHours).toEqual([
        "hours",
      ]);
    }
  });
});
