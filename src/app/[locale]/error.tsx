"use client";

import { useEffect } from "react";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[portal] unhandled render error", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <main className="max-w-md text-center">
        <h1 className="text-page-title text-ink">Something went wrong</h1>
        <p className="mt-3 text-sm text-ink-muted">
          The page could not be rendered. Try again, and sign in once more if the
          problem continues.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-action px-6 text-sm font-medium text-knockout"
        >
          Try again
        </button>
      </main>
    </div>
  );
}
