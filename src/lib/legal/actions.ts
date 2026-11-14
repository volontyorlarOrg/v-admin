"use server";

import { revalidatePath } from "next/cache";

import { failedResult, type ActionResult } from "@/lib/api/action-result";
import { writeReturning } from "@/lib/api/gateway.server";
import { legalReceiptSchema, legalResolutionSchema } from "@/lib/legal/schemas";

export async function resolveLegalRequestAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = legalResolutionSchema.safeParse({
    id: formData.get("id"),
    resolution: formData.get("resolution"),
  });
  if (!parsed.success) return failedResult("validationFailed");
  const { result } = await writeReturning("resolveLegalRequest", {
    params: { id: parsed.data.id },
    body: { resolution: parsed.data.resolution },
    schema: legalReceiptSchema,
  });
  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}
