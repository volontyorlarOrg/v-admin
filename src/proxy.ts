import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { refreshSession } from "@/lib/auth/refresh";
import {
  SESSION_COOKIE_NAME,
  decryptSession,
  encryptSession,
  isAccessTokenExpired,
  isAccessTokenExpiring,
  sessionCookieOptions,
  type SessionPayload,
} from "@/lib/auth/session";
import { defaultLocale, isLocale, routing } from "@/i18n/routing";
import {
  ENTRY_ROUTE,
  HOME_ROUTE,
  PASSWORD_ROUTE,
  getRoute,
  guardFor,
  localePath,
  pathWithoutLocale,
} from "@/lib/routing/routes";

const intl = createMiddleware(routing);

function localeOf(pathname: string) {
  const segment = pathname.split("/")[1];
  return isLocale(segment) ? segment : defaultLocale;
}

function isNavigation(request: NextRequest) {
  if (request.method !== "GET") return false;
  if (request.headers.get("next-router-prefetch")) return false;
  if (request.headers.get("purpose") === "prefetch") return false;
  if (request.headers.get("rsc")) return true;
  return request.headers.get("accept")?.includes("text/html") ?? false;
}

async function carrySession(
  response: NextResponse,
  rotated: SessionPayload | null,
  cleared: boolean,
) {
  if (cleared) {
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      ...sessionCookieOptions(),
      maxAge: 0,
    });
    return response;
  }

  if (!rotated) return response;

  const value = await encryptSession(rotated);
  if (value) response.cookies.set(SESSION_COOKIE_NAME, value, sessionCookieOptions());
  return response;
}

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const guard = guardFor(pathname);
  const locale = localeOf(pathname);

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const current = await decryptSession(cookie);
  let session: SessionPayload | null = current;
  let rotated: SessionPayload | null = null;
  let refreshFailed = false;

  if (current && isAccessTokenExpiring(current) && isNavigation(request)) {
    rotated = await refreshSession(current);
    if (rotated) {
      session = rotated;
    } else if (isAccessTokenExpired(current)) {
      refreshFailed = true;
      session = null;
    }
  }

  const redirectTo = (route: typeof ENTRY_ROUTE) =>
    NextResponse.redirect(new URL(localePath(locale, route), request.url), 307);

  if (guard === "session" && !session) {
    const loginUrl = new URL(localePath(locale, ENTRY_ROUTE), request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    if (cookie || refreshFailed) loginUrl.searchParams.set("session", "expired");
    return carrySession(NextResponse.redirect(loginUrl, 307), null, true);
  }

  if (guard === "guest" && session) {
    return carrySession(
      redirectTo(session.passwordChangeRequired ? PASSWORD_ROUTE : HOME_ROUTE),
      rotated,
      false,
    );
  }

  if (
    session?.passwordChangeRequired &&
    guard === "session" &&
    pathWithoutLocale(pathname) !== getRoute(PASSWORD_ROUTE).path
  ) {
    return carrySession(redirectTo(PASSWORD_ROUTE), rotated, false);
  }

  const response = intl(request);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");

  return carrySession(response, rotated, refreshFailed);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
