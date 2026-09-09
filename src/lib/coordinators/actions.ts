"use server";

import { revalidatePath } from "next/cache";

import { failedResult, type ActionResult } from "@/lib/api/action-result";
import { write } from "@/lib/api/gateway.server";
import {
  fieldErrorsOf,
  stringField,
  temporaryPasswordSchema,
} from "@/lib/auth/credentials";
import { createCoordinatorSchema } from "@/lib/coordinators/schema";

export async function createCoordinatorAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createCoordinatorSchema.safeParse({
    displayName: stringField(formData, "displayName"),
    email: stringField(formData, "email"),
    temporaryPassword: stringField(formData, "temporaryPassword"),
  });

  if (!parsed.success) {
    return failedResult("validationFailed", fieldErrorsOf(parsed.error));
  }

  const result = await write("createCoordinator", { body: parsed.data });
  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}

export async function blockCoordinatorAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "id");
  if (!id) return failedResult("coordinatorNotFound");

  const result = await write("blockCoordinator", { params: { id } });
  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}

export async function unblockCoordinatorAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "id");
  if (!id) return failedResult("coordinatorNotFound");

  const result = await write("unblockCoordinator", { params: { id } });
  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}

export async function removeCoordinatorAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "id");
  if (!id) return failedResult("coordinatorNotFound");

  const reassignToCoordinatorId = stringField(
    formData,
    "reassignToCoordinatorId",
  ).trim();

  const result = await write("removeCoordinator", {
    params: { id },
    body: reassignToCoordinatorId ? { reassignToCoordinatorId } : {},
  });

  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}

export async function replaceCoordinatorPasswordAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "id");
  if (!id) return failedResult("coordinatorNotFound");

  const parsed = temporaryPasswordSchema.safeParse({
    temporaryPassword: stringField(formData, "temporaryPassword"),
  });

  if (!parsed.success) {
    return failedResult("validationFailed", fieldErrorsOf(parsed.error));
  }

  const result = await write("replaceCoordinatorPassword", {
    params: { id },
    body: parsed.data,
  });

  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}
