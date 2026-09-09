"use server";

import { revalidatePath } from "next/cache";

import { failedResult, type ActionResult } from "@/lib/api/action-result";
import { write } from "@/lib/api/gateway.server";
import { fieldErrorsOf, stringField } from "@/lib/auth/credentials";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
} from "@/lib/organizations/schema";

function checkbox(formData: FormData, name: string): boolean {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

export async function createOrganizationAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createOrganizationSchema.safeParse({
    name: stringField(formData, "name"),
    slug: stringField(formData, "slug"),
    logoUrl: stringField(formData, "logoUrl"),
    verified: checkbox(formData, "verified"),
  });

  if (!parsed.success) {
    return failedResult("validationFailed", fieldErrorsOf(parsed.error));
  }

  const { logoUrl, ...rest } = parsed.data;
  const result = await write("createOrganization", {
    body: { ...rest, ...(logoUrl ? { logoUrl } : {}) },
  });

  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}

export async function updateOrganizationAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "id");
  if (!id) return failedResult("organizationNotFound");

  const parsed = updateOrganizationSchema.safeParse({
    name: stringField(formData, "name"),
    logoUrl: stringField(formData, "logoUrl"),
    verified: checkbox(formData, "verified"),
  });

  if (!parsed.success) {
    return failedResult("validationFailed", fieldErrorsOf(parsed.error));
  }

  const { logoUrl, ...rest } = parsed.data;
  const result = await write("updateOrganization", {
    params: { id },
    body: { ...rest, ...(logoUrl ? { logoUrl } : {}) },
  });

  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}
