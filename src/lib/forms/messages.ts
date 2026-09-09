import type { ActionResult } from "@/lib/api/action-result";
import type { FieldErrors } from "@/lib/api/errors";

export type MessageCatalog = Record<string, string>;

export function errorMessage(
  code: string,
  catalog: MessageCatalog,
  fallback: string,
): string {
  return catalog[code] ?? fallback;
}

export function fieldMessage(
  fields: FieldErrors,
  name: string,
  catalog: MessageCatalog,
): string | undefined {
  const code = fields[name]?.[0];
  if (!code) return undefined;
  return catalog[code] ?? code;
}

export function formError(
  result: ActionResult,
  catalog: MessageCatalog,
  fallback: string,
): string | null {
  if (result.status !== "error") return null;
  if (result.code === "validationFailed" && Object.keys(result.fields).length > 0) {
    return null;
  }
  return errorMessage(result.code, catalog, fallback);
}

export function fieldsOf(result: ActionResult): FieldErrors {
  return result.status === "error" ? result.fields : {};
}

export function isSuccess(result: ActionResult): boolean {
  return result.status === "ok";
}
