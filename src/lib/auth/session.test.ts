import { afterEach, describe, expect, it, vi } from "vitest";

import {
  decryptSession,
  encryptSession,
  holdsPortalRole,
  isAccessTokenExpired,
  isAccessTokenExpiring,
  isSessionStatus,
  issuedSessionSchema,
  SESSION_MAX_AGE_SECONDS,
  safeReturnPath,
  sessionCookieOptions,
  toPublicSession,
  toSessionPayload,
  type SessionPayload,
} from "@/lib/auth/session";
import { PORTAL_ID, PORTAL_ROLE, SESSION_SECRET_VARIABLE } from "@/lib/portal";

const SECRET = "a-session-secret-that-is-long-enough-0123456789";
const OTHER_SECRET = "a-different-secret-that-is-long-enough-9876543210";

function payload(overrides: Partial<SessionPayload> = {}): SessionPayload {
  return {
    portal: PORTAL_ID,
    userId: "00000000-0000-4000-8000-000000000001",
    roles: [PORTAL_ROLE],
    accessToken: "access-token",
    refreshToken: "refresh-token",
    accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 900,
    passwordChangeRequired: false,
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("the session cookie", () => {
  it("cannot be minted or read without a secret", async () => {
    vi.stubEnv(SESSION_SECRET_VARIABLE, "");
    expect(await encryptSession(payload())).toBeNull();
    expect(await decryptSession("anything")).toBeNull();
  });

  it("is encrypted, not merely signed: no token survives in readable form", async () => {
    vi.stubEnv(SESSION_SECRET_VARIABLE, SECRET);
    const value = await encryptSession(payload());

    expect(value).toBeTruthy();
    expect(value).not.toContain("access-token");
    expect(value).not.toContain("refresh-token");

    const [header] = value!.split(".");
    expect(JSON.parse(atob(header!))).toMatchObject({ alg: "dir", enc: "A256GCM" });
  });

  it("round-trips through encryption with the same secret", async () => {
    vi.stubEnv(SESSION_SECRET_VARIABLE, SECRET);
    const value = await encryptSession(payload());

    expect(await decryptSession(value!)).toMatchObject({
      userId: "00000000-0000-4000-8000-000000000001",
      accessToken: "access-token",
      portal: PORTAL_ID,
    });
  });

  it("refuses a cookie minted with another portal's secret", async () => {
    vi.stubEnv(SESSION_SECRET_VARIABLE, SECRET);
    const value = await encryptSession(payload());

    vi.stubEnv(SESSION_SECRET_VARIABLE, OTHER_SECRET);
    expect(await decryptSession(value!)).toBeNull();
  });

  it("refuses a session that does not hold this portal's role", async () => {
    vi.stubEnv(SESSION_SECRET_VARIABLE, SECRET);
    const value = await encryptSession(payload({ roles: ["volunteer"] }));

    expect(await decryptSession(value!)).toBeNull();
  });

  it("refuses a tampered cookie", async () => {
    vi.stubEnv(SESSION_SECRET_VARIABLE, SECRET);
    const value = await encryptSession(payload());

    expect(await decryptSession(`${value}tampered`)).toBeNull();
  });

  it("is HttpOnly, SameSite=Strict and path-wide", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(sessionCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
    expect(SESSION_MAX_AGE_SECONDS).toBe(60 * 60 * 24 * 90);
  });
});

describe("issuedSessionSchema", () => {
  it("keeps only the roles this product defines", () => {
    const parsed = issuedSessionSchema.parse({
      userId: "u1",
      accessToken: "a",
      roles: ["coordinator", "wizard", "admin"],
    });

    expect(parsed.roles).toEqual(["coordinator", "admin"]);
  });

  it("defaults a missing password-change flag to false", () => {
    expect(issuedSessionSchema.parse({ userId: "u1", accessToken: "a" })).toMatchObject(
      {
        passwordChangeRequired: false,
      },
    );
  });

  it("rejects a response with no access token", () => {
    expect(issuedSessionSchema.safeParse({ userId: "u1" }).success).toBe(false);
  });
});

describe("holdsPortalRole", () => {
  it("is false for a session without this portal's role", () => {
    expect(holdsPortalRole({ roles: ["volunteer"] })).toBe(false);
    expect(holdsPortalRole(null)).toBe(false);
  });

  it("is true for a session that holds it", () => {
    expect(holdsPortalRole({ roles: ["volunteer", PORTAL_ROLE] })).toBe(true);
  });
});

describe("access token lifetime", () => {
  const now = 1_700_000_000_000;
  const nowSeconds = now / 1000;

  it("treats a token inside the refresh skew as expiring", () => {
    expect(isAccessTokenExpiring({ accessTokenExpiresAt: nowSeconds + 30 }, now)).toBe(
      true,
    );
    expect(isAccessTokenExpiring({ accessTokenExpiresAt: nowSeconds + 600 }, now)).toBe(
      false,
    );
  });

  it("distinguishes expiring from expired", () => {
    expect(isAccessTokenExpired({ accessTokenExpiresAt: nowSeconds + 30 }, now)).toBe(
      false,
    );
    expect(isAccessTokenExpired({ accessTokenExpiresAt: nowSeconds - 1 }, now)).toBe(
      true,
    );
  });

  it("never expires a session whose token carries no expiry", () => {
    expect(isAccessTokenExpiring({ accessTokenExpiresAt: undefined }, now)).toBe(false);
    expect(isAccessTokenExpired({ accessTokenExpiresAt: undefined }, now)).toBe(false);
  });
});

describe("toPublicSession", () => {
  it("drops both tokens before anything can reach a client component", () => {
    const shared = toPublicSession(payload({ displayName: "Nodira" }));

    expect(shared).toEqual({
      userId: "00000000-0000-4000-8000-000000000001",
      roles: [PORTAL_ROLE],
      displayName: "Nodira",
      passwordChangeRequired: false,
    });
    expect(JSON.stringify(shared)).not.toContain("token");
  });
});

describe("toSessionPayload", () => {
  it("stamps the portal so a cookie cannot be replayed into another portal", () => {
    expect(
      toSessionPayload({
        userId: "u1",
        accessToken: "a",
        roles: [PORTAL_ROLE],
        passwordChangeRequired: true,
      }),
    ).toMatchObject({ portal: PORTAL_ID, passwordChangeRequired: true });
  });
});

describe("safeReturnPath", () => {
  it("accepts only a same-origin absolute path", () => {
    expect(safeReturnPath("/uz/dashboard")).toBe("/uz/dashboard");
    expect(safeReturnPath("//evil.example.org")).toBeNull();
    expect(safeReturnPath("https://evil.example.org")).toBeNull();
    expect(safeReturnPath("/uz\\dashboard")).toBeNull();
    expect(safeReturnPath(null)).toBeNull();
  });
});

describe("isSessionStatus", () => {
  it("accepts only the statuses the login page can render", () => {
    expect(isSessionStatus("expired")).toBe(true);
    expect(isSessionStatus("wrongRole")).toBe(true);
    expect(isSessionStatus("anything-else")).toBe(false);
  });
});
