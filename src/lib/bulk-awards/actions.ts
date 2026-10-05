"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { failedResult, type ActionResult } from "@/lib/api/action-result";
import { read, write, writeReturning } from "@/lib/api/gateway.server";
import { isReady } from "@/lib/api/load";
import { stringField } from "@/lib/auth/credentials";
import {
  bulkAwardInputSchema,
  bulkAwardSchema,
  eligibleIdsSchema,
  type BulkAward,
} from "./schema";

export type CreateAwardState = { result: ActionResult; award?: BulkAward };

export async function createBulkAwardAction(
  _previous: CreateAwardState,
  form: FormData,
): Promise<CreateAwardState> {
  let userIds: unknown;
  try {
    userIds = JSON.parse(stringField(form, "userIds") || "[]");
  } catch {
    return { result: failedResult("bulkAwardSelectionInvalid") };
  }
  const parsed = bulkAwardInputSchema.safeParse({
    submissionId: stringField(form, "submissionId"),
    scope: stringField(form, "scope"),
    userIds,
    xp: stringField(form, "xp"),
    hours: stringField(form, "hours"),
    reason: stringField(form, "reason"),
  });
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.message ?? "bulkAwardInputInvalid";
    return { result: failedResult(code) };
  }
  const { userIds: ids, ...award } = parsed.data;
  const response = await writeReturning("createBulkAward", {
    schema: bulkAwardSchema,
    body: award.scope === "selected" ? { ...award, userIds: ids } : award,
  });
  if (response.result.status === "ok") revalidatePath("/", "layout");
  return {
    result: response.result,
    ...(response.data ? { award: response.data } : {}),
  };
}

export async function revokeBulkAwardAction(
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const id = stringField(form, "id");
  if (!z.uuid().safeParse(id).success) return failedResult("bulkAwardNotFound");
  const result = await write("revokeBulkAward", { params: { id } });
  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}

export async function matchingVolunteerIdsAction(
  q: string,
): Promise<{ ids: string[]; truncated: boolean } | { error: string }> {
  const loaded = await read("bulkAwardEligibleIds", {
    schema: eligibleIdsSchema,
    query: q.trim() ? { q: q.trim().slice(0, 120) } : {},
  });
  if (!isReady(loaded)) return { error: "selectAllFailed" };
  return { ids: loaded.data.ids, truncated: loaded.data.truncated };
}
