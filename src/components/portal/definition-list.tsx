import type { ReactNode } from "react";

export type Definition = { term: string; value: ReactNode };

export function DefinitionList({ items }: { items: Definition[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.term} className="min-w-0">
          <dt className="eyebrow text-ink-muted">{item.term}</dt>
          <dd className="mt-1 text-sm break-words text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
