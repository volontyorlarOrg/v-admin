"use server";

import { revalidatePath } from "next/cache";

import { failedResult, type ActionResult } from "@/lib/api/action-result";
import { write } from "@/lib/api/gateway.server";
import {
  fieldErrorsOf,
  stringField,
  temporaryPasswordSchema,
} from "@/lib/auth/credentials";

export async function replaceUserPasswordAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "id");
  if (!id) return failedResult("userNotFound");

  const parsed = temporaryPasswordSchema.safeParse({
    temporaryPassword: stringField(formData, "temporaryPassword"),
  });

  if (!parsed.success) {
    return failedResult("validationFailed", fieldErrorsOf(parsed.error));
  }

  const result = await write("replaceUserPassword", {
    params: { id },
    body: parsed.data,
  });

  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}
