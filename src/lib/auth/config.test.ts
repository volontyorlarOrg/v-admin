import { afterEach, describe, expect, it, vi } from "vitest";

import {
  apiBaseUrl,
  isAuthConfigured,
  isSecureCookieTransport,
  proxySecret,
  sessionSecret,
} from "@/lib/auth/config";
import { SESSION_SECRET_VARIABLE } from "@/lib/portal";

const LONG_ENOUGH = "a-session-secret-that-is-long-enough-0123456789";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("apiBaseUrl", () => {
  it("is null when unset, so nothing silently calls a guessed origin", () => {
    vi.stubEnv("VOLONTYORLAR_API_URL", "");
    expect(apiBaseUrl()).toBeNull();
  });

  it("rejects a non-http protocol", () => {
    vi.stubEnv("VOLONTYORLAR_API_URL", "file:///etc/passwd");
    expect(apiBaseUrl()).toBeNull();
  });

  it("keeps a base path but drops trailing slashes", () => {
    vi.stubEnv("VOLONTYORLAR_API_URL", "https://api.example.org/v1/");
    expect(apiBaseUrl()).toBe("https://api.example.org/v1");
  });
});

describe("sessionSecret", () => {
  it("reads the variable belonging to this portal only", () => {
    vi.stubEnv(SESSION_SECRET_VARIABLE, LONG_ENOUGH);
    expect(sessionSecret()).toBe(LONG_ENOUGH);
  });

  it("refuses a secret shorter than 32 characters", () => {
    vi.stubEnv(SESSION_SECRET_VARIABLE, "too-short");
    expect(sessionSecret()).toBeNull();
  });
});

describe("isAuthConfigured", () => {
  it("needs both the API origin and the session secret", () => {
    vi.stubEnv("VOLONTYORLAR_API_URL", "https://api.example.org");
    vi.stubEnv(SESSION_SECRET_VARIABLE, "");
    expect(isAuthConfigured()).toBe(false);

    vi.stubEnv(SESSION_SECRET_VARIABLE, LONG_ENOUGH);
    expect(isAuthConfigured()).toBe(true);
  });
});

describe("isSecureCookieTransport", () => {
  it("never marks the cookie Secure in development, so localhost can sign in", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isSecureCookieTransport()).toBe(false);
  });

  it("defaults to Secure in production when no origin is configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_PORTAL_URL", "");
    expect(isSecureCookieTransport()).toBe(true);
  });

  it("allows an explicit http origin in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_PORTAL_URL", "http://127.0.0.1:3002");
    expect(isSecureCookieTransport()).toBe(false);
  });
});

describe("proxySecret", () => {
  it("returns the shared secret the backend uses to trust a visitor address", () => {
    vi.stubEnv(
      "VOLONTYORLAR_PROXY_SECRET",
      "  frontend-proxy-secret-value-at-least-32-characters ",
    );
    expect(proxySecret()).toBe("frontend-proxy-secret-value-at-least-32-characters");
  });

  it("stays off while the secret is missing or too short to trust", () => {
    for (const value of ["", "short-secret"]) {
      vi.stubEnv("VOLONTYORLAR_PROXY_SECRET", value);
      expect(proxySecret(), value).toBeNull();
    }
  });
});
