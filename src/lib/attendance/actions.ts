"use server";

import { revalidatePath } from "next/cache";

import { failedResult, type ActionResult } from "@/lib/api/action-result";
import { write } from "@/lib/api/gateway.server";
import { fieldErrorsOf, stringField } from "@/lib/auth/credentials";
import { resolveAttendanceSchema } from "@/lib/attendance/schema";

export async function resolveAttendanceAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const applicationId = stringField(formData, "applicationId");
  if (!applicationId) return failedResult("attendanceNotFound");

  const hours = stringField(formData, "confirmedHours").trim();
  const parsed = resolveAttendanceSchema.safeParse({
    outcome: stringField(formData, "outcome"),
    ...(hours ? { confirmedHours: hours } : {}),
  });

  if (!parsed.success) {
    return failedResult("validationFailed", fieldErrorsOf(parsed.error));
  }

  const result = await write("resolveAttendance", {
    params: { applicationId },
    body: {
      outcome: parsed.data.outcome,
      ...(parsed.data.outcome === "attended"
        ? { confirmedHours: Number(parsed.data.confirmedHours) }
        : {}),
    },
  });

  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}
