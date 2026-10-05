"use server";

import { revalidatePath } from "next/cache";

import { failedResult, type ActionResult } from "@/lib/api/action-result";
import { write } from "@/lib/api/gateway.server";
import { fieldErrorsOf, stringField } from "@/lib/auth/credentials";
import { pastEventSchema } from "@/lib/users/past-events";

function inputOf(formData: FormData) {
  const credited = formData.get("countsTowardProgress") === "on";
  return pastEventSchema.safeParse({
    title: stringField(formData, "title"),
    organizationId: stringField(formData, "organizationId"),
    eventDate: stringField(formData, "eventDate"),
    hours: stringField(formData, "hours"),
    xpAwarded: credited ? stringField(formData, "xpAwarded") || "0" : "0",
    countsTowardProgress: credited,
  });
}

export async function createPastEventAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "id");
  const submissionId = stringField(formData, "submissionId");
  if (!id) return failedResult("userNotFound");
  if (!submissionId) return failedResult("pastEventSubmissionConflict");
  const parsed = inputOf(formData);
  if (!parsed.success)
    return failedResult("validationFailed", fieldErrorsOf(parsed.error));
  const result = await write("createPastEvent", {
    params: { id },
    body: { ...parsed.data, submissionId },
  });
  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}

export async function updatePastEventAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "id");
  const eventId = stringField(formData, "eventId");
  if (!id || !eventId) return failedResult("pastEventNotFound");
  const parsed = inputOf(formData);
  if (!parsed.success)
    return failedResult("validationFailed", fieldErrorsOf(parsed.error));
  const result = await write("updatePastEvent", {
    params: { id, eventId },
    body: parsed.data,
  });
  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}

export async function removePastEventAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "id");
  const eventId = stringField(formData, "eventId");
  if (!id || !eventId) return failedResult("pastEventNotFound");
  const result = await write("removePastEvent", { params: { id, eventId } });
  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}
