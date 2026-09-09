"use server";

import { revalidatePath } from "next/cache";

import { failedResult, type ActionResult } from "@/lib/api/action-result";
import { write } from "@/lib/api/gateway.server";
import { reviewSchema } from "@/lib/applications/review";
import { fieldErrorsOf, stringField } from "@/lib/auth/credentials";

export async function reviewApplicationAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "id");
  if (!id) return failedResult("applicationNotFound");

  const note = stringField(formData, "reviewerNote").trim();
  const parsed = reviewSchema.safeParse({
    status: stringField(formData, "status"),
    ...(note ? { reviewerNote: note } : {}),
  });

  if (!parsed.success) {
    return failedResult("validationFailed", fieldErrorsOf(parsed.error));
  }

  const result = await write("reviewApplication", {
    params: { id },
    body: parsed.data,
  });

  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}
