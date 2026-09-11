"use client";

import { TriangleAlert } from "lucide-react";

export type ErrorSummaryItem = {
  name: string;
  label: string;
  message: string;
  id?: string;
};

export function ErrorSummary({
  title,
  items,
}: {
  title: string;
  items: readonly ErrorSummaryItem[];
}) {
  if (items.length === 0) return null;

  return (
    <div
      role="alert"
      data-slot="error-summary"
      className="rounded-lg border border-danger/40 bg-danger-muted px-4 py-3"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-danger-ink">
        <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
        {title}
      </p>
      <ul className="mt-2 flex flex-col gap-1 pl-6">
        {items.map((item) => (
          <li key={item.name} className="text-sm text-ink">
            {item.id ? (
              <button
                type="button"
                className="text-left underline underline-offset-2 hover:text-danger-ink"
                onClick={() => document.getElementById(item.id as string)?.focus()}
              >
                <span className="font-medium">{item.label}</span> — {item.message}
              </button>
            ) : (
              <>
                <span className="font-medium">{item.label}</span> — {item.message}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
