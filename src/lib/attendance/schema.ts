import { z } from "zod";

import { RESOLVABLE_ATTENDANCE_OUTCOMES } from "@/lib/domain/vocabulary";

export const MAX_CONFIRMED_HOURS = 999;

export const resolveAttendanceSchema = z
  .object({
    outcome: z.enum(RESOLVABLE_ATTENDANCE_OUTCOMES, { message: "required" }),
    confirmedHours: z.string().trim().optional(),
  })
  .superRefine((values, context) => {
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
    if (!Number.isFinite(hours) || hours < 0 || hours > MAX_CONFIRMED_HOURS) {
      context.addIssue({ code: "custom", path: ["confirmedHours"], message: "hours" });
    }
  });
