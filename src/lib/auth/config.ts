import { rawSessionSecret } from "@/lib/portal";

const MINIMUM_SESSION_SECRET_LENGTH = 32;

export const AUTH_ROUTE_MAX_DURATION_SECONDS = 60;
export const AUTH_REQUEST_TIMEOUT_MS = 55_000;

export function apiBaseUrl(): string | null {
  const raw = process.env.VOLONTYORLAR_API_URL?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}

export function sessionSecret(): string | null {
  const value = rawSessionSecret()?.trim();
  return value && value.length >= MINIMUM_SESSION_SECRET_LENGTH ? value : null;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function fixtureModeEnabled(): boolean {
  return !isProduction() && process.env.VOLONTYORLAR_FIXTURES?.trim() === "on";
}

export function isAuthConfigured(): boolean {
  if (fixtureModeEnabled()) return sessionSecret() !== null;
  return apiBaseUrl() !== null && sessionSecret() !== null;
}

export function isSecureCookieTransport(): boolean {
  if (!isProduction()) return false;

  const raw = process.env.NEXT_PUBLIC_PORTAL_URL?.trim();
  if (!raw) return true;

  try {
    return new URL(raw).protocol !== "http:";
  } catch {
    return true;
  }
}
