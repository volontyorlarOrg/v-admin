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

function expireSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
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

  if (guard === "session" && !session) {
    const loginUrl = new URL(localePath(locale, ENTRY_ROUTE), request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    if (cookie || refreshFailed) loginUrl.searchParams.set("session", "expired");
    return expireSessionCookie(NextResponse.redirect(loginUrl, 307));
  }

  if (guard === "guest" && session) {
    const destination = session.passwordChangeRequired ? PASSWORD_ROUTE : HOME_ROUTE;
    return NextResponse.redirect(
      new URL(localePath(locale, destination), request.url),
      307,
    );
  }

  if (
    session?.passwordChangeRequired &&
    guard === "session" &&
    pathWithoutLocale(pathname) !== getRoute(PASSWORD_ROUTE).path
  ) {
    return NextResponse.redirect(
      new URL(localePath(locale, PASSWORD_ROUTE), request.url),
      307,
    );
  }

  const response = intl(request);

  if (rotated) {
    const value = await encryptSession(rotated);
    if (value) response.cookies.set(SESSION_COOKIE_NAME, value, sessionCookieOptions());
  } else if (refreshFailed) {
    expireSessionCookie(response);
  }

  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
