import { apiBaseUrl } from "@/lib/auth/config";
import {
  holdsPortalRole,
  issuedSessionSchema,
  toSessionPayload,
  type SessionPayload,
} from "@/lib/auth/session";

const REFRESH_TIMEOUT_MS = 20_000;

export async function refreshSession(
  current: SessionPayload,
): Promise<SessionPayload | null> {
  const baseUrl = apiBaseUrl();
  if (!baseUrl || !current.refreshToken) return null;

  try {
    const response = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
    });

    if (!response.ok) return null;

    const parsed = issuedSessionSchema.safeParse(await response.json());
    if (!parsed.success) return null;

    const rotated = toSessionPayload(parsed.data);
    if (!holdsPortalRole(rotated)) return null;

    return {
      ...rotated,
      passwordChangeRequired:
        rotated.passwordChangeRequired || current.passwordChangeRequired,
    };
  } catch {
    return null;
  }
}
