import { describe, expect, it } from "vitest";

import {
  configuredTransportIsSecure,
  contentSecurityPolicy,
  securityHeaders,
} from "@/lib/security/headers";

describe("configuredTransportIsSecure", () => {
  it("is false when no origin is configured", () => {
    expect(configuredTransportIsSecure(undefined)).toBe(false);
    expect(configuredTransportIsSecure("   ")).toBe(false);
  });

  it("is false for a malformed origin rather than guessing", () => {
    expect(configuredTransportIsSecure("staff.example.org")).toBe(false);
  });

  it("is true only for https", () => {
    expect(configuredTransportIsSecure("https://staff.example.org")).toBe(true);
    expect(configuredTransportIsSecure("http://localhost:3002")).toBe(false);
  });
});

describe("contentSecurityPolicy", () => {
  it("forbids framing and third-party origins", () => {
    const policy = contentSecurityPolicy({
      development: false,
      secureTransport: true,
    });

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).toContain("upgrade-insecure-requests");
  });

  it("allows the development websocket only in development", () => {
    const development = contentSecurityPolicy({
      development: true,
      secureTransport: false,
    });
    const production = contentSecurityPolicy({
      development: false,
      secureTransport: false,
    });

    expect(development).toContain("connect-src 'self' ws:");
    expect(production).toContain("connect-src 'self'");
    expect(production).not.toContain("ws:");
    expect(production).not.toContain("unsafe-eval");
  });
});

describe("securityHeaders", () => {
  const headerFor = (
    key: string,
    environment = { development: false, secureTransport: true },
  ) => securityHeaders(environment).find((header) => header.key === key)?.value;

  it("keeps every response out of search indexes", () => {
    expect(headerFor("X-Robots-Tag")).toBe("noindex, nofollow, noarchive");
  });

  it("keeps every response out of shared caches", () => {
    expect(headerFor("Cache-Control")).toBe("private, no-store");
  });

  it("sends HSTS only over a configured https origin", () => {
    expect(headerFor("Strict-Transport-Security")).toContain("max-age=63072000");
    expect(
      headerFor("Strict-Transport-Security", {
        development: true,
        secureTransport: false,
      }),
    ).toBeUndefined();
  });
});
