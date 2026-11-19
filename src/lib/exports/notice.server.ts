import "server-only";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { isSecureCookieTransport } from "@/lib/auth/config";
import { exportLocale } from "@/lib/exports/labels.server";
import {
  EXPORT_NOTICE_COOKIE,
  exportNoticeSchema,
  readJsonCookie,
  type ExportNotice,
  type SheetsStart,
} from "@/lib/exports/schemas";
import { vacancyHref } from "@/lib/routing/routes";

export function noticeTarget(
  start: Pick<SheetsStart, "locale" | "vacancyId" | "list">,
) {
  return `/${exportLocale(start.locale)}${vacancyHref(start.vacancyId)}?tab=${start.list}`;
}

export function setNotice(response: NextResponse, notice: ExportNotice) {
  response.cookies.set(EXPORT_NOTICE_COOKIE, JSON.stringify(notice), {
    httpOnly: false,
    secure: isSecureCookieTransport(),
    sameSite: "lax",
    path: "/",
    maxAge: 120,
  });
}

export async function readNotice(vacancyId: string): Promise<ExportNotice | null> {
  const store = await cookies();
  const notice = readJsonCookie(
    store.get(EXPORT_NOTICE_COOKIE)?.value,
    exportNoticeSchema,
  );
  return notice?.vacancyId === vacancyId ? notice : null;
}
