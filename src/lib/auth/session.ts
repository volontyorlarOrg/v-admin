import { EncryptJWT, jwtDecrypt } from "jose";
import { z } from "zod";

import { isSecureCookieTransport, sessionSecret } from "@/lib/auth/config";
import { PORTAL_ID, PORTAL_ROLE, SESSION_COOKIE_NAME } from "@/lib/portal";

export { SESSION_COOKIE_NAME };

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 2;
export const ACCESS_TOKEN_REFRESH_SKEW_SECONDS = 60;

export const ROLES = ["volunteer", "partner", "coordinator", "admin"] as const;
export type Role = (typeof ROLES)[number];

const roleList = z
  .array(z.string())
  .transform((roles) => roles.filter((role): role is Role => isRole(role)));

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export const sessionPayloadSchema = z.object({
  portal: z.literal(PORTAL_ID),
  userId: z.string().min(1),
  roles: z.array(z.enum(ROLES)),
  displayName: z.string().optional(),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  accessTokenExpiresAt: z.number().int().positive().optional(),
  passwordChangeRequired: z.boolean().default(false),
});

export type SessionPayload = z.infer<typeof sessionPayloadSchema>;

export const issuedSessionSchema = z.object({
  userId: z.string().min(1),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).optional(),
  accessTokenExpiresAt: z.number().int().positive().optional(),
  displayName: z.string().nullish(),
  roles: roleList.default([]),
  passwordChangeRequired: z.boolean().default(false),
});

export type IssuedSession = z.infer<typeof issuedSessionSchema>;

export function toSessionPayload(issued: IssuedSession): SessionPayload {
  return {
    portal: PORTAL_ID,
    userId: issued.userId,
    accessToken: issued.accessToken,
    roles: issued.roles,
    passwordChangeRequired: issued.passwordChangeRequired,
    ...(issued.accessTokenExpiresAt !== undefined
      ? { accessTokenExpiresAt: issued.accessTokenExpiresAt }
      : {}),
    ...(issued.displayName ? { displayName: issued.displayName } : {}),
  };
}

export type PublicSession = {
  userId: string;
  roles: Role[];
  displayName?: string;
  passwordChangeRequired: boolean;
};

export function toPublicSession(session: SessionPayload): PublicSession {
  return {
    userId: session.userId,
    roles: session.roles,
    passwordChangeRequired: session.passwordChangeRequired,
    ...(session.displayName !== undefined ? { displayName: session.displayName } : {}),
  };
}

export function hasRole(
  session: Pick<SessionPayload, "roles"> | PublicSession | null,
  role: Role,
): boolean {
  return session?.roles.includes(role) ?? false;
}

export function holdsPortalRole(
  session: Pick<SessionPayload, "roles"> | PublicSession | null,
): boolean {
  return hasRole(session, PORTAL_ROLE);
}

export function isAccessTokenExpiring(
  session: Pick<SessionPayload, "accessTokenExpiresAt">,
  now: number = Date.now(),
): boolean {
  if (session.accessTokenExpiresAt === undefined) return false;
  const nowSeconds = Math.floor(now / 1000);
  return session.accessTokenExpiresAt - ACCESS_TOKEN_REFRESH_SKEW_SECONDS <= nowSeconds;
}

export function isAccessTokenExpired(
  session: Pick<SessionPayload, "accessTokenExpiresAt">,
  now: number = Date.now(),
): boolean {
  if (session.accessTokenExpiresAt === undefined) return false;
  return session.accessTokenExpiresAt <= Math.floor(now / 1000);
}

export const SESSION_STATUSES = ["expired", "signedOut", "wrongRole"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export function isSessionStatus(value: unknown): value is SessionStatus {
  return (
    typeof value === "string" && (SESSION_STATUSES as readonly string[]).includes(value)
  );
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isSecureCookieTransport(),
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function safeReturnPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.includes("\\")) return null;
  return value;
}

let cachedKey: Uint8Array | null = null;
let cachedFrom: string | null = null;

async function encryptionKey(): Promise<Uint8Array | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  if (cachedKey && cachedFrom === secret) return cachedKey;

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${PORTAL_ID}:${secret}`),
  );
  cachedKey = new Uint8Array(digest);
  cachedFrom = secret;
  return cachedKey;
}

export async function encryptSession(payload: SessionPayload): Promise<string | null> {
  const key = await encryptionKey();
  if (!key) return null;

  return new EncryptJWT({ ...payload })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .encrypt(key);
}

export async function decryptSession(
  value: string | undefined,
): Promise<SessionPayload | null> {
  if (!value) return null;

  const key = await encryptionKey();
  if (!key) return null;

  try {
    const { payload } = await jwtDecrypt(value, key);
    const parsed = sessionPayloadSchema.safeParse(payload);
    if (!parsed.success) return null;
    return holdsPortalRole(parsed.data) ? parsed.data : null;
  } catch {
    return null;
  }
}
