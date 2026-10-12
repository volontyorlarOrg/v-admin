"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { failedResult, type ActionResult } from "@/lib/api/action-result";
import { write } from "@/lib/api/gateway.server";
import { fieldErrorsOf, stringField } from "@/lib/auth/credentials";
import { approvalSchema, rejectionSchema } from "@/lib/past-events/review";

function settled(
  result: ActionResult,
  values: Record<string, string> = {},
): ActionResult {
  if (result.status === "ok") {
    revalidatePath("/", "layout");
    return result;
  }
  return result.status === "error"
    ? { ...result, values, submissionId: randomUUID() }
    : result;
}

export async function approvePastEventRequestAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "requestId");
  if (!id) return failedResult("pastEventRequestNotFound");
  if (!formData.has("hours")) {
    return settled(
      await write("approvePastEventRequest", { params: { id }, body: {} }),
    );
  }
  const values = {
    hours: stringField(formData, "hours"),
    xpAwarded: stringField(formData, "xpAwarded"),
  };
  const parsed = approvalSchema.safeParse(values);
  if (!parsed.success)
    return settled(
      failedResult("validationFailed", fieldErrorsOf(parsed.error)),
      values,
    );
  return settled(
    await write("approvePastEventRequest", { params: { id }, body: parsed.data }),
    values,
  );
}

export async function rejectPastEventRequestAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "requestId");
  if (!id) return failedResult("pastEventRequestNotFound");
  const values = { note: stringField(formData, "note") };
  const parsed = rejectionSchema.safeParse(values);
  if (!parsed.success)
    return settled(
      failedResult("validationFailed", fieldErrorsOf(parsed.error)),
      values,
    );
  return settled(
    await write("rejectPastEventRequest", { params: { id }, body: parsed.data }),
    values,
  );
}
