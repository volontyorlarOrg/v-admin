import { z } from "zod";

import { RESOLVABLE_ATTENDANCE_OUTCOMES } from "@/lib/domain/vocabulary";

export const MAX_CONFIRMED_HOURS = 999;

type HoursSubject = {
  outcome: (typeof RESOLVABLE_ATTENDANCE_OUTCOMES)[number];
  confirmedHours?: string | undefined;
};

function checkHours(values: HoursSubject, context: z.RefinementCtx) {
  if (values.outcome !== "attended") return;

  if (!values.confirmedHours) {
    context.addIssue({
      code: "custom",
      path: ["confirmedHours"],
      message: "confirmedHoursRequired",
    });
    return;
  }

  const hours = Number(values.confirmedHours);
  if (!Number.isFinite(hours) || hours < 0.25 || hours > MAX_CONFIRMED_HOURS) {
    context.addIssue({ code: "custom", path: ["confirmedHours"], message: "hours" });
  }
}

export const resolveAttendanceSchema = z
  .object({
    outcome: z.enum(RESOLVABLE_ATTENDANCE_OUTCOMES, { message: "required" }),
    confirmedHours: z.string().trim().optional(),
  })
  .superRefine(checkHours);

export const batchAttendanceSchema = z
  .object({
    outcome: z.enum(RESOLVABLE_ATTENDANCE_OUTCOMES, { message: "required" }),
    confirmedHours: z.string().trim().optional(),
    applicationIds: z
      .array(z.string().min(1))
      .min(1, "noVolunteersSelected")
      .max(500, "tooManyVolunteers"),
  })
  .superRefine(checkHours);

export function attendanceBody(values: {
  outcome: (typeof RESOLVABLE_ATTENDANCE_OUTCOMES)[number];
  confirmedHours?: string | undefined;
}) {
  return {
    outcome: values.outcome,
    ...(values.outcome === "attended"
      ? { confirmedHours: Number(values.confirmedHours) }
      : {}),
  };
}

export function attendanceRecords(values: {
  applicationIds: string[];
  outcome: (typeof RESOLVABLE_ATTENDANCE_OUTCOMES)[number];
  confirmedHours?: string | undefined;
}) {
  const resolution = attendanceBody(values);
  return values.applicationIds.map((applicationId) => ({
    applicationId,
    ...resolution,
  }));
}
