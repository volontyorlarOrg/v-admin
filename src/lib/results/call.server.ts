import "server-only";

import type { z } from "zod";

import { authedApi } from "@/lib/api/client.server";
import { endpoints, pathFor, type EndpointName } from "@/lib/api/endpoints";
import { isApiError, isSessionOver } from "@/lib/api/errors";
import { getSession } from "@/lib/auth/session.server";

export type CallFailure = {
  ok: false;
  code: string;
  applicationIds?: string[];
  problems?: Array<{ applicationId: string; reason: string }>;
  fields?: Record<string, string[]>;
};

export type CallResult<T> = { ok: true; data: T } | CallFailure;

function failureFrom(error: unknown): CallFailure {
  if (isSessionOver(error)) return { ok: false, code: "sessionExpired" };
  if (!isApiError(error)) return { ok: false, code: "server" };
  const details =
    error.details && typeof error.details === "object"
      ? (error.details as Record<string, unknown>)
      : {};
  const applicationIds = Array.isArray(details.applicationIds)
    ? details.applicationIds.filter((item): item is string => typeof item === "string")
    : undefined;
  const problems = Array.isArray(details.problems)
    ? details.problems.flatMap((item) =>
        item &&
        typeof item === "object" &&
        typeof (item as { applicationId?: unknown }).applicationId === "string" &&
        typeof (item as { reason?: unknown }).reason === "string"
          ? [item as { applicationId: string; reason: string }]
          : [],
      )
    : undefined;
  const fields = error.fieldErrors;
  return {
    ok: false,
    code: error.backendCode ?? error.code,
    ...(applicationIds ? { applicationIds } : {}),
    ...(problems ? { problems } : {}),
    ...(Object.keys(fields).length > 0 ? { fields } : {}),
  };
}

export async function call<TSchema extends z.ZodType>(
  name: EndpointName,
  {
    params,
    body,
    schema,
  }: { params?: Record<string, string>; body?: unknown; schema: TSchema },
): Promise<CallResult<z.infer<TSchema>>> {
  const session = await getSession();
  if (!session) return { ok: false, code: "sessionExpired" };
  try {
    const data = await authedApi(pathFor(name, params), session.accessToken, {
      method: endpoints[name].method,
      body,
      schema,
    });
    return { ok: true, data: data as z.infer<TSchema> };
  } catch (error) {
    return failureFrom(error);
  }
}
