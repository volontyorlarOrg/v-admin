"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { failedResult, type ActionResult } from "@/lib/api/action-result";
import { write, writeMultipart } from "@/lib/api/gateway.server";
import { fieldErrorsOf, stringField } from "@/lib/auth/credentials";
import { DECISION_ENDPOINTS, vacancyDecisionSchema } from "@/lib/vacancies/decision";
import {
  toVacancyPayload,
  toVacancyUpdatePayload,
  vacancyFormSchema,
  vacancyFromFormData,
} from "@/lib/vacancies/form";

function revalidateVacancies() {
  revalidatePath("/", "layout");
}

function preserveSubmittedValues(
  result: ActionResult,
  values: Record<string, string>,
): ActionResult {
  return result.status === "error"
    ? { ...result, values, submissionId: randomUUID() }
    : result;
}

function vacancySlug(title: string): string {
  const readable = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
  return `${readable || "vacancy"}-${randomUUID().slice(0, 8)}`;
}

export async function createVacancyAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const values = vacancyFromFormData(formData);
  const parsed = vacancyFormSchema.safeParse(values);
  if (!parsed.success) {
    return preserveSubmittedValues(
      failedResult("validationFailed", fieldErrorsOf(parsed.error)),
      values,
    );
  }

  const result = await write("createVacancy", {
    body: {
      ...toVacancyPayload(parsed.data),
      slug: vacancySlug(parsed.data.title),
    },
  });
  if (result.status === "ok") revalidateVacancies();
  return preserveSubmittedValues(result, values);
}

export async function updateVacancyAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "id");
  if (!id) return failedResult("opportunityNotFound");

  const values = vacancyFromFormData(formData);
  const parsed = vacancyFormSchema.safeParse(values);
  if (!parsed.success) {
    return preserveSubmittedValues(
      failedResult("validationFailed", fieldErrorsOf(parsed.error)),
      values,
    );
  }

  const result = await write("updateVacancy", {
    params: { id },
    body: toVacancyUpdatePayload(parsed.data),
  });
  if (result.status === "ok") revalidateVacancies();
  return preserveSubmittedValues(result, values);
}

export async function uploadVacancyImageAction(
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "id");
  const image = formData.get("image");
  if (!id) return failedResult("opportunityNotFound");
  if (!(image instanceof File) || image.size === 0)
    return failedResult("opportunityImageInvalid");
  if (image.size > 2_097_152) return failedResult("opportunityImageTooLarge");
  const body = new FormData();
  body.set("image", image);
  const result = await writeMultipart("uploadVacancyImage", { id }, body);
  if (result.status === "ok") revalidateVacancies();
  return result;
}

export async function removeVacancyImageAction(
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "id");
  if (!id) return failedResult("opportunityNotFound");
  const result = await write("removeVacancyImage", { params: { id } });
  if (result.status === "ok") revalidateVacancies();
  return result;
}

export async function decideVacancyAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "id");
  if (!id) return failedResult("opportunityNotFound");

  const note = stringField(formData, "note").trim();
  const parsed = vacancyDecisionSchema.safeParse({
    decision: stringField(formData, "decision"),
    ...(note ? { note } : {}),
  });

  if (!parsed.success) {
    return failedResult("validationFailed", fieldErrorsOf(parsed.error));
  }

  const result = await write(DECISION_ENDPOINTS[parsed.data.decision], {
    params: { id },
    ...(parsed.data.note ? { body: { note: parsed.data.note } } : {}),
  });

  if (result.status === "ok") revalidateVacancies();
  return result;
}

export async function submitVacancyForApprovalAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "id");
  if (!id) return failedResult("opportunityNotFound");

  const result = await write("submitVacancyForApproval", { params: { id } });
  if (result.status === "ok") revalidateVacancies();
  return result;
}

export async function publishVacancyAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "id");
  if (!id) return failedResult("opportunityNotFound");

  const result = await write("publishVacancy", { params: { id } });
  if (result.status === "ok") revalidateVacancies();
  return result;
}

export async function archiveVacancyAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "id");
  if (!id) return failedResult("opportunityNotFound");

  const result = await write("archiveVacancy", { params: { id } });
  if (result.status === "ok") revalidateVacancies();
  return result;
}
