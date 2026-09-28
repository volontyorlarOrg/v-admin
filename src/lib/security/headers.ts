export type SecurityHeader = { key: string; value: string };

export type SecurityEnvironment = {
  development: boolean;
  secureTransport: boolean;
  blogWebOrigin?: string | null;
};

export function configuredBlogWebOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && url.origin === value
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

export function configuredTransportIsSecure(origin: string | undefined): boolean {
  const raw = origin?.trim();
  if (!raw) return false;

  try {
    return new URL(raw).protocol === "https:";
  } catch {
    return false;
  }
}

export function contentSecurityPolicy({
  development,
  secureTransport,
  blogWebOrigin,
}: SecurityEnvironment): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    `form-action 'self'${blogWebOrigin ? ` ${blogWebOrigin}` : ""}`,
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ""}`,
    `connect-src 'self'${development ? " ws:" : ""}`,
    "manifest-src 'self'",
    ...(secureTransport ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export function securityHeaders({
  development,
  secureTransport,
  blogWebOrigin,
}: SecurityEnvironment): SecurityHeader[] {
  return [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
    { key: "Cache-Control", value: "private, no-store" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    },
    ...(secureTransport
      ? [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ]
      : []),
    {
      key: "Content-Security-Policy",
      value: contentSecurityPolicy({ development, secureTransport, blogWebOrigin }),
    },
  ];
}
