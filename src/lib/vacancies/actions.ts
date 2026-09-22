"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { failedResult, type ActionResult } from "@/lib/api/action-result";
import { write } from "@/lib/api/gateway.server";
import { fieldErrorsOf, stringField } from "@/lib/auth/credentials";
import { DECISION_ENDPOINTS, vacancyDecisionSchema } from "@/lib/vacancies/decision";
import {
  toVacancyPayload,
  vacancyFormSchema,
  vacancyFromFormData,
} from "@/lib/vacancies/form";

function revalidateVacancies() {
  revalidatePath("/", "layout");
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
  const parsed = vacancyFormSchema.safeParse(vacancyFromFormData(formData));
  if (!parsed.success) {
    return failedResult("validationFailed", fieldErrorsOf(parsed.error));
  }

  const result = await write("createVacancy", {
    body: {
      ...toVacancyPayload(parsed.data),
      slug: vacancySlug(parsed.data.title),
    },
  });
  if (result.status === "ok") revalidateVacancies();
  return result;
}

export async function updateVacancyAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = stringField(formData, "id");
  if (!id) return failedResult("opportunityNotFound");

  const parsed = vacancyFormSchema.safeParse(vacancyFromFormData(formData));
  if (!parsed.success) {
    return failedResult("validationFailed", fieldErrorsOf(parsed.error));
  }

  const result = await write("updateVacancy", {
    params: { id },
    body: toVacancyPayload(parsed.data),
  });
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
