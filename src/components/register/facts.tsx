import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type Fact = { term: string; value: ReactNode };

export function Facts({ items, className }: { items: Fact[]; className?: string }) {
  if (items.length === 0) return null;

  return (
    <dl className={cn("@container divide-y divide-border", className)}>
      {items.map((item) => (
        <div
          key={item.term}
          className="grid gap-0.5 py-2.5 @md:grid-cols-[10rem_minmax(0,1fr)] @md:gap-4"
        >
          <dt className="text-sm text-ink-muted">{item.term}</dt>
          <dd className="min-w-0 text-sm break-words text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export type Figure = { label: string; value: string; tone?: "person" };

export function FigureRow({
  items,
  className,
}: {
  items: Figure[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3 xl:grid-cols-5",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="bg-surface px-5 py-4">
          <dt className="text-sm text-ink-muted">{item.label}</dt>
          <dd
            className={cn(
              "display-face tabular mt-1.5 text-figure-inline",
              item.tone === "person" ? "text-accent-ink" : "text-ink",
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Totals({
  id,
  title,
  items,
  action,
}: {
  id: string;
  title: string;
  items: { key: string; value: ReactNode }[];
  action?: ReactNode;
}) {
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-border pt-4"
    >
      <h2 id={`${id}-title`} className="text-sm font-semibold text-ink">
        {title}
      </h2>
      <ul className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5 text-sm text-ink-muted">
        {items.map((item) => (
          <li key={item.key}>{item.value}</li>
        ))}
      </ul>
      {action ? <div className="ml-auto">{action}</div> : null}
    </section>
  );
}
