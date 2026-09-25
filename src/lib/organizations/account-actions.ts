"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { failedResult, type ActionResult } from "@/lib/api/action-result";
import { write } from "@/lib/api/gateway.server";
import { fieldErrorsOf, stringField } from "@/lib/auth/credentials";

const passwordSchema = z.object({
  password: z.string().min(8, "passwordShort").max(128, "passwordLong"),
});

function accountId(formData: FormData) {
  return z.uuid().safeParse(stringField(formData, "id"));
}

async function passwordAction(
  endpoint: "createOrganizationAccount" | "replaceOrganizationAccountPassword",
  formData: FormData,
): Promise<ActionResult> {
  const id = accountId(formData);
  if (!id.success) return failedResult("organizationNotFound");
  const parsed = passwordSchema.safeParse({
    password: stringField(formData, "password"),
  });
  if (!parsed.success)
    return failedResult("validationFailed", fieldErrorsOf(parsed.error));
  const result = await write(endpoint, { params: { id: id.data }, body: parsed.data });
  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}

export async function createOrganizationAccountAction(
  _previous: ActionResult,
  formData: FormData,
) {
  return passwordAction("createOrganizationAccount", formData);
}

export async function replaceOrganizationAccountPasswordAction(
  _previous: ActionResult,
  formData: FormData,
) {
  return passwordAction("replaceOrganizationAccountPassword", formData);
}

async function statusAction(
  endpoint: "blockOrganizationAccount" | "unblockOrganizationAccount",
  formData: FormData,
): Promise<ActionResult> {
  const id = accountId(formData);
  if (!id.success) return failedResult("organizationNotFound");
  const result = await write(endpoint, { params: { id: id.data } });
  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}

export async function blockOrganizationAccountAction(
  _previous: ActionResult,
  formData: FormData,
) {
  return statusAction("blockOrganizationAccount", formData);
}

export async function unblockOrganizationAccountAction(
  _previous: ActionResult,
  formData: FormData,
) {
  return statusAction("unblockOrganizationAccount", formData);
}
