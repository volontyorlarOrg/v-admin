"use server";

import { revalidatePath } from "next/cache";
import { failedResult, type ActionResult } from "@/lib/api/action-result";
import { writeReturning } from "@/lib/api/gateway.server";
import { reportSchema, reportStatusSchema } from "@/lib/reports/schemas";

export async function updateReportStatusAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = reportStatusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    version: formData.get("version"),
  });
  if (!parsed.success) return failedResult("validationFailed");
  const { id, ...body } = parsed.data;
  const { result } = await writeReturning("updateReportStatus", {
    params: { id },
    body,
    schema: reportSchema,
  });
  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}
