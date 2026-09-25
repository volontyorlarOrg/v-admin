"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { failedResult, type ActionResult } from "@/lib/api/action-result";
import { write } from "@/lib/api/gateway.server";
import { stringField } from "@/lib/auth/credentials";
import { progressAdjustmentOf, progressValuesOf } from "@/lib/users/progress";

export async function adjustUserProgressAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "id");
  if (!id) return failedResult("userNotFound");

  const values = progressValuesOf(formData);
  const adjustment = progressAdjustmentOf(values);
  const result =
    "result" in adjustment
      ? adjustment.result
      : await write("adjustUserProgress", { params: { id }, body: adjustment.body });

  if (result.status === "ok") {
    revalidatePath("/", "layout");
    return result;
  }
  return result.status === "error"
    ? { ...result, values, submissionId: randomUUID() }
    : result;
}
