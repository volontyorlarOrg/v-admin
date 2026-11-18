"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { failedResult, type ActionResult } from "@/lib/api/action-result";
import { write } from "@/lib/api/gateway.server";

const input = z.object({
  id: z.string().uuid(),
  organizationId: z.union([z.literal(""), z.string().uuid()]),
  verified: z.boolean(),
});

export async function updateVerificationAction(
  _previous: ActionResult,
  data: FormData,
): Promise<ActionResult> {
  const parsed = input.safeParse({
    id: data.get("id"),
    organizationId: data.get("organizationId") ?? "",
    verified: data.get("verified") === "on",
  });
  if (!parsed.success) return failedResult("validationFailed");
  const { id, organizationId, verified } = parsed.data;
  const result = await write("updateVerification", {
    params: { id },
    body: { verified, organizationId: verified ? organizationId || null : null },
  });
  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}
