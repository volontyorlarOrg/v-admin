import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="en" data-theme="light">
      <body className="flex min-h-dvh items-center justify-center px-6">
        <main className="max-w-md text-center">
          <h1 className="text-page-title text-ink">Not found</h1>
          <p className="mt-3 text-sm text-ink-muted">
            This address does not exist in this portal.
          </p>
        </main>
      </body>
    </html>
  );
}
