"use server";

import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";

import { authedDownload } from "@/lib/api/client.server";
import { pathFor } from "@/lib/api/endpoints";
import { isApiError, isSessionOver } from "@/lib/api/errors";
import { isReady } from "@/lib/api/load";
import { getSession } from "@/lib/auth/session.server";
import { isSecureCookieTransport } from "@/lib/auth/config";
import { exportLabels, exportLocale } from "@/lib/exports/labels.server";
import { googleRedirectUri } from "@/lib/exports/google.server";
import {
  SHEETS_COOKIE_PATH,
  SHEETS_START_COOKIE,
  googleAuthorizationSchema,
  type ExportRequest,
  type FileFormat,
  type SheetsStart,
} from "@/lib/exports/schemas";
import { call } from "@/lib/results/call.server";
import { loadVacancy } from "@/lib/vacancies/data.server";

export type ExportFile = { name: string; type: string; base64: string; rows: number };
export type ExportFailure = { ok: false; code: string };

function failure(error: unknown): ExportFailure {
  if (isSessionOver(error)) return { ok: false, code: "sessionExpired" };
  if (isApiError(error)) return { ok: false, code: error.backendCode ?? error.code };
  return { ok: false, code: "generic" };
}

function spec(request: ExportRequest, locale: string) {
  return {
    list: request.list,
    fields: request.fields,
    locale,
    ...(request.list === "applications" && request.filter
      ? { filter: request.filter }
      : {}),
    ...(request.query?.trim() ? { query: request.query.trim().slice(0, 120) } : {}),
  };
}

async function vacancyTitle(vacancyId: string) {
  const vacancy = await loadVacancy(vacancyId);
  return isReady(vacancy) ? vacancy.data.title : null;
}

export async function downloadVolunteerExportAction(
  request: ExportRequest,
  format: FileFormat,
): Promise<{ ok: true; file: ExportFile } | ExportFailure> {
  const session = await getSession();
  if (!session) return { ok: false, code: "sessionExpired" };
  const locale = exportLocale(await getLocale());
  const title = await vacancyTitle(request.vacancyId);
  if (!title) return { ok: false, code: "opportunityNotFound" };
  try {
    const download = await authedDownload(
      pathFor("exportVolunteers", { id: request.vacancyId }),
      session.accessToken,
      {
        ...spec(request, locale),
        format,
        labels: await exportLabels(locale, request.list, title),
      },
    );
    return {
      ok: true,
      file: {
        name: download.fileName ?? `volunteers.${format}`,
        type: download.contentType,
        base64: Buffer.from(download.bytes).toString("base64"),
        rows: download.rows ?? 0,
      },
    };
  } catch (error) {
    return failure(error);
  }
}

export async function startGoogleSheetsExportAction(
  request: ExportRequest,
): Promise<{ ok: true; url: string } | ExportFailure> {
  const redirectUri = googleRedirectUri();
  if (!redirectUri) return { ok: false, code: "googleSheetsExportUnavailable" };
  const locale = exportLocale(await getLocale());
  const title = await vacancyTitle(request.vacancyId);
  if (!title) return { ok: false, code: "opportunityNotFound" };
  const result = await call("authorizeGoogleSheetsExport", {
    params: { id: request.vacancyId },
    body: { ...spec(request, locale), redirectUri },
    schema: googleAuthorizationSchema,
  });
  if (!result.ok) return { ok: false, code: result.code };
  const start: SheetsStart = {
    state: result.data.state,
    vacancyId: request.vacancyId,
    list: request.list,
    locale,
    title: title.slice(0, 300),
  };
  const store = await cookies();
  store.set(SHEETS_START_COOKIE, JSON.stringify(start), {
    httpOnly: true,
    secure: isSecureCookieTransport(),
    sameSite: "lax",
    path: SHEETS_COOKIE_PATH,
    maxAge: 600,
  });
  return { ok: true, url: result.data.authorizationUrl };
}
