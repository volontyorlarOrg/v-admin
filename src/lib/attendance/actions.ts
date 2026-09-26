"use server";

import { revalidatePath } from "next/cache";

import { failedResult, type ActionResult } from "@/lib/api/action-result";
import { write } from "@/lib/api/gateway.server";
import { fieldErrorsOf, stringField } from "@/lib/auth/credentials";
import {
  attendanceBody,
  attendanceRecords,
  batchAttendanceSchema,
  resolveAttendanceSchema,
} from "@/lib/attendance/schema";

export async function resolveAttendanceAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const applicationId = stringField(formData, "applicationId");
  if (!applicationId) return failedResult("attendanceNotFound");

  const hours = stringField(formData, "confirmedHours").trim();
  const parsed = resolveAttendanceSchema.safeParse({
    outcome: stringField(formData, "outcome"),
    kind: stringField(formData, "kind") || "volunteering",
    ...(hours ? { confirmedHours: hours } : {}),
  });

  if (!parsed.success) {
    return failedResult("validationFailed", fieldErrorsOf(parsed.error));
  }

  const result = await write("resolveAttendance", {
    params: { applicationId },
    body: attendanceBody(parsed.data),
  });

  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}

export async function resolveVacancyAttendanceAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "vacancyId");
  if (!id) return failedResult("opportunityNotFound");

  const hours = stringField(formData, "confirmedHours").trim();
  const parsed = batchAttendanceSchema.safeParse({
    outcome: stringField(formData, "outcome"),
    kind: stringField(formData, "kind") || "volunteering",
    ...(hours ? { confirmedHours: hours } : {}),
    applicationIds: formData
      .getAll("applicationIds")
      .filter((value): value is string => typeof value === "string" && value !== ""),
  });

  if (!parsed.success) {
    return failedResult("validationFailed", fieldErrorsOf(parsed.error));
  }

  const result = await write("resolveVacancyAttendance", {
    params: { id },
    body: {
      records: attendanceRecords(parsed.data),
    },
  });

  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}
