import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

import {
  configuredBlogWebOrigin,
  configuredTransportIsSecure,
  securityHeaders,
} from "./src/lib/security/headers";

const development = process.env.NODE_ENV === "development";
const secureTransport = configuredTransportIsSecure(process.env.NEXT_PUBLIC_PORTAL_URL);
const blogWebOrigin = configuredBlogWebOrigin(process.env.BLOG_WEB_ORIGIN);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [],
  },
  experimental: {
    globalNotFound: true,
    serverActions: { bodySizeLimit: "5mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({ development, secureTransport, blogWebOrigin }),
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
