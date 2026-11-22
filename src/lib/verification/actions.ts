"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { failedResult, type ActionResult } from "@/lib/api/action-result";
import { write, writeMultipart } from "@/lib/api/gateway.server";
import { badgeUploadSchema } from "@/lib/api/schemas";
import { badgeFromFormData } from "@/lib/verification/badge";

const input = z.object({
  id: z.string().uuid(),
  verified: z.boolean(),
});

export async function updateVerificationAction(
  _previous: ActionResult,
  data: FormData,
): Promise<ActionResult> {
  const parsed = input.safeParse({
    id: data.get("id"),
    verified: data.get("verified") === "on",
  });
  if (!parsed.success) return failedResult("validationFailed");
  const { id, verified } = parsed.data;
  const result = await write("updateVerification", {
    params: { id },
    body: { verified },
  });
  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}

const badgeTarget = z.object({ id: z.string().uuid() });

export async function uploadVerificationBadgeAction(
  _previous: ActionResult,
  data: FormData,
): Promise<ActionResult> {
  const target = badgeTarget.safeParse({ id: data.get("id") });
  if (!target.success) return failedResult("validationFailed");
  const badge = badgeFromFormData(data);
  if (!badge.file) return failedResult(badge.error ?? "badgeImageInvalid");
  const body = new FormData();
  body.set("badge", badge.file);
  const result = await writeMultipart(
    "uploadVerificationBadge",
    { id: target.data.id },
    body,
    badgeUploadSchema,
  );
  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}

export async function removeVerificationBadgeAction(
  _previous: ActionResult,
  data: FormData,
): Promise<ActionResult> {
  const target = badgeTarget.safeParse({ id: data.get("id") });
  if (!target.success) return failedResult("validationFailed");
  const result = await write("removeVerificationBadge", {
    params: { id: target.data.id },
  });
  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}
