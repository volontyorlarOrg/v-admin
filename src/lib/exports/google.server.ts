import "server-only";

import { read } from "@/lib/api/gateway.server";
import type { Loaded } from "@/lib/api/load";
import { exportOptionsSchema, type ExportOptions } from "@/lib/exports/schemas";

export const GOOGLE_CALLBACK_PATH = "/api/exports/google/callback";
export const GOOGLE_FINISH_PATH = "/api/exports/google/finish";

export function googleRedirectUri(): string | null {
  const raw = process.env.NEXT_PUBLIC_PORTAL_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return new URL(GOOGLE_CALLBACK_PATH, url.origin).toString();
  } catch {
    return null;
  }
}

export function loadExportOptions(): Promise<Loaded<ExportOptions>> {
  return read("volunteerExportOptions", { schema: exportOptionsSchema });
}
