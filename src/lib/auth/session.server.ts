import "server-only";

import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  decryptSession,
  encryptSession,
  sessionCookieOptions,
  type SessionPayload,
} from "@/lib/auth/session";

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return decryptSession(store.get(SESSION_COOKIE_NAME)?.value);
}

export async function writeSession(payload: SessionPayload): Promise<boolean> {
  const value = await encryptSession(payload);
  if (!value) return false;

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, value, sessionCookieOptions());
  return true;
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, "", { ...sessionCookieOptions(), maxAge: 0 });
}
