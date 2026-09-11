import { describe, expect, it } from "vitest";

import { fieldErrorsOf } from "@/lib/auth/credentials";
import {
  attendanceBody,
  attendanceRecords,
  batchAttendanceSchema,
  resolveAttendanceSchema,
} from "@/lib/attendance/schema";

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
    for (const confirmedHours of ["-1", "0", "1000", "many"]) {
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

describe("batchAttendanceSchema", () => {
  const selection = { applicationIds: ["app-1", "app-2"] };

  it("applies one outcome and one number of hours to the volunteers chosen", () => {
    const result = batchAttendanceSchema.safeParse({
      ...selection,
      outcome: "attended",
      confirmedHours: "4",
    });
    expect(result.success).toBe(true);
  });

  it("refuses a batch with nobody selected", () => {
    const result = batchAttendanceSchema.safeParse({
      applicationIds: [],
      outcome: "excused",
    });
    expect(fieldErrorsOf(result.error!).applicationIds).toEqual([
      "noVolunteersSelected",
    ]);
  });

  it("asks for the hours once, not once per volunteer", () => {
    const result = batchAttendanceSchema.safeParse({
      ...selection,
      outcome: "attended",
    });
    expect(fieldErrorsOf(result.error!).confirmedHours).toEqual([
      "confirmedHoursRequired",
    ]);
  });
});

describe("attendanceBody", () => {
  it("sends hours only with an attendance the hours belong to", () => {
    expect(attendanceBody({ outcome: "attended", confirmedHours: "4" })).toEqual({
      outcome: "attended",
      confirmedHours: 4,
    });
    expect(attendanceBody({ outcome: "excused", confirmedHours: "4" })).toEqual({
      outcome: "excused",
    });
  });
});

describe("attendanceRecords", () => {
  it("expands a bulk choice into the backend record contract", () => {
    expect(
      attendanceRecords({
        applicationIds: ["app-1", "app-2"],
        outcome: "attended",
        confirmedHours: "4",
      }),
    ).toEqual([
      { applicationId: "app-1", outcome: "attended", confirmedHours: 4 },
      { applicationId: "app-2", outcome: "attended", confirmedHours: 4 },
    ]);
  });
});
