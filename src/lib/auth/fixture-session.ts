import { IS_ADMIN_PORTAL, PORTAL_ROLE } from "@/lib/portal";
import {
  FIXTURE_ADMIN_EMAIL,
  FIXTURE_ADMIN_ID,
  FIXTURE_COORDINATOR_EMAIL,
  FIXTURE_COORDINATOR_ID,
  FIXTURE_PASSWORD,
} from "@/lib/fixtures/data";
import type { IssuedSession } from "@/lib/auth/session";

const ACCESS_TOKEN_TTL_SECONDS = 60 * 30;

export const fixtureEmail = IS_ADMIN_PORTAL
  ? FIXTURE_ADMIN_EMAIL
  : FIXTURE_COORDINATOR_EMAIL;

export const fixtureUserId = IS_ADMIN_PORTAL
  ? FIXTURE_ADMIN_ID
  : FIXTURE_COORDINATOR_ID;

export const fixtureDisplayName = IS_ADMIN_PORTAL
  ? "Volontyorlar Administrator"
  : "Nodira Alimova";

export function fixtureSessionFor(
  email: string,
  password: string,
): IssuedSession | null {
  if (email.trim().toLowerCase() !== fixtureEmail) return null;
  if (password !== FIXTURE_PASSWORD) return null;

  return {
    userId: fixtureUserId,
    accessToken: "development-fixture-access-token",
    refreshToken: "development-fixture-refresh-token",
    accessTokenExpiresAt: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS,
    displayName: fixtureDisplayName,
    roles: [PORTAL_ROLE],
    passwordChangeRequired: false,
  };
}
