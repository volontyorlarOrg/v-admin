import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

import {
  configuredTransportIsSecure,
  securityHeaders,
} from "./src/lib/security/headers";

const development = process.env.NODE_ENV === "development";
const secureTransport = configuredTransportIsSecure(process.env.NEXT_PUBLIC_PORTAL_URL);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [],
  },
  experimental: {
    globalNotFound: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({ development, secureTransport }),
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
