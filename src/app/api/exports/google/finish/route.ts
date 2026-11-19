import { NextResponse, type NextRequest } from "next/server";

import { authedApi } from "@/lib/api/client.server";
import { endpoints, pathFor } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/errors";
import { getSession } from "@/lib/auth/session.server";
import { exportLabels, exportLocale } from "@/lib/exports/labels.server";
import { noticeTarget, setNotice } from "@/lib/exports/notice.server";
import {
  SHEETS_COOKIE_PATH,
  SHEETS_GRANT_COOKIE,
  googleSheetSchema,
  readJsonCookie,
  sheetsGrantSchema,
} from "@/lib/exports/schemas";
import { localePath } from "@/lib/routing/routes";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const grant = readJsonCookie(
    request.cookies.get(SHEETS_GRANT_COOKIE)?.value,
    sheetsGrantSchema,
  );
  const redirect = (path: string) => {
    const response = new NextResponse(null, {
      status: 303,
      headers: { Location: path },
    });
    response.cookies.set(SHEETS_GRANT_COOKIE, "", {
      path: SHEETS_COOKIE_PATH,
      maxAge: 0,
    });
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  };

  if (!grant) return redirect(`/${exportLocale(undefined)}`);

  const locale = exportLocale(grant.locale);
  const session = await getSession();
  if (!session) return redirect(localePath(locale, "login"));

  const back = noticeTarget(grant);
  try {
    const sheet = await authedApi(
      pathFor("createGoogleSheetsExport"),
      session.accessToken,
      {
        method: endpoints.createGoogleSheetsExport.method,
        body: {
          code: grant.code,
          state: grant.state,
          labels: await exportLabels(locale, grant.list, grant.title),
        },
        schema: googleSheetSchema,
        timeoutMs: 55_000,
      },
    );
    const response = redirect(back);
    setNotice(response, {
      status: "created",
      vacancyId: grant.vacancyId,
      url: sheet.spreadsheetUrl,
      rows: sheet.rows,
    });
    return response;
  } catch (error) {
    const response = redirect(back);
    setNotice(response, {
      status: "failed",
      vacancyId: grant.vacancyId,
      code: isApiError(error) ? (error.backendCode ?? error.code) : "generic",
    });
    return response;
  }
}
