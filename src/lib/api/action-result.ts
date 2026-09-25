import { isApiError, type FieldErrors } from "@/lib/api/errors";

export type ActionResult =
  | { status: "idle" }
  | { status: "ok"; code?: string }
  | {
      status: "error";
      code: string;
      fields: FieldErrors;
      values?: Record<string, string>;
      submissionId?: string;
    };

export const idleResult: ActionResult = { status: "idle" };
export const okResult: ActionResult = { status: "ok" };

export function succeededResult(code: string): ActionResult {
  return { status: "ok", code };
}

export function failedResult(
  code: string,
  fields: FieldErrors = {},
  values?: Record<string, string>,
): ActionResult {
  return { status: "error", code, fields, ...(values ? { values } : {}) };
}

export function resultFromError(error: unknown): ActionResult {
  if (isApiError(error)) {
    return failedResult(error.backendCode ?? error.code, error.fieldErrors);
  }
  return failedResult("server");
}
