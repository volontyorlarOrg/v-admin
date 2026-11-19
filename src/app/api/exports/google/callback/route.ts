import { NextResponse, type NextRequest } from "next/server";

import { isSecureCookieTransport } from "@/lib/auth/config";
import { GOOGLE_FINISH_PATH } from "@/lib/exports/google.server";
import { exportLocale } from "@/lib/exports/labels.server";
import { noticeTarget, setNotice } from "@/lib/exports/notice.server";
import {
  SHEETS_COOKIE_PATH,
  SHEETS_GRANT_COOKIE,
  SHEETS_START_COOKIE,
  readJsonCookie,
  sheetsStartSchema,
  type SheetsGrant,
} from "@/lib/exports/schemas";

export const dynamic = "force-dynamic";

function hop(path: string) {
  const target = path.startsWith("/") && !path.startsWith("//") ? path : "/";
  const encoded = JSON.stringify(target).replace(/</g, "\\u003c");
  const response = new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${target.replace(/"/g, "&quot;")}"><title>Volontyorlar</title></head><body><script>location.replace(${encoded})</script></body></html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
  response.cookies.set(SHEETS_START_COOKIE, "", {
    path: SHEETS_COOKIE_PATH,
    maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const start = readJsonCookie(
    request.cookies.get(SHEETS_START_COOKIE)?.value,
    sheetsStartSchema,
  );
  const params = request.nextUrl.searchParams;
  const state = params.get("state");
  const code = params.get("code");

  if (!start || !state || state !== start.state) {
    return hop(`/${exportLocale(start?.locale)}`);
  }

  const back = noticeTarget(start);
  if (!code || params.get("error")) {
    const response = hop(back);
    setNotice(response, {
      status: "failed",
      vacancyId: start.vacancyId,
      code: params.get("error") === "access_denied" ? "exportCancelled" : "generic",
    });
    return response;
  }

  const grant: SheetsGrant = { ...start, code: code.slice(0, 2048) };
  const response = hop(GOOGLE_FINISH_PATH);
  response.cookies.set(SHEETS_GRANT_COOKIE, JSON.stringify(grant), {
    httpOnly: true,
    secure: isSecureCookieTransport(),
    sameSite: "strict",
    path: SHEETS_COOKIE_PATH,
    maxAge: 120,
  });
  return response;
}
