export const PREFERENCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const PREFERENCE_LOCALE_COOKIE = "NEXT_LOCALE";

export function preferenceCookieSecure(): boolean {
  const raw = process.env.NEXT_PUBLIC_PORTAL_URL?.trim();
  if (!raw) return false;

  try {
    return new URL(raw).protocol === "https:";
  } catch {
    return false;
  }
}

export function readPreferenceCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = new RegExp(`(?:^|;\\s*)${name}=([^;]*)`).exec(document.cookie);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function writePreferenceCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    "path=/",
    `max-age=${PREFERENCE_COOKIE_MAX_AGE}`,
    "samesite=lax",
    ...(preferenceCookieSecure() ? ["secure"] : []),
  ].join("; ");
}
