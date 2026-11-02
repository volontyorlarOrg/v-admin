import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import {
  SESSION_COOKIE_NAME,
  decryptSession,
  encryptSession,
  sessionCookieOptions,
  type SessionPayload,
} from "@/lib/auth/session";

const decryptOnce = cache((value: string | undefined) => decryptSession(value));

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return decryptOnce(store.get(SESSION_COOKIE_NAME)?.value);
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
