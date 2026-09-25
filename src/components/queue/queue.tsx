import type { ReactNode } from "react";

import { Count } from "@/components/register/register";
import { cn } from "@/lib/utils";

export function QueueSection({
  id,
  title,
  count,
  countLabel,
  action,
  children,
}: {
  id: string;
  title: string;
  count: number;
  countLabel: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="border-t border-border first:border-t-0"
    >
      <header className="flex flex-wrap items-center gap-2 px-5 pt-4 pb-3">
        <h3 id={`${id}-title`} className="text-sm font-semibold text-ink">
          {title}
        </h3>
        <Count value={count} label={countLabel} tone="waiting" />
        {action ? <div className="ml-auto hidden lg:block">{action}</div> : null}
      </header>
      <ol className="divide-y divide-border border-t border-border">{children}</ol>
      {action ? (
        <div className="border-t border-border px-5 py-2.5 lg:hidden">{action}</div>
      ) : null}
    </section>
  );
}

export function QueueRow({
  number,
  numberLabel,
  children,
  className,
}: {
  number?: number;
  numberLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "grid grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2.5 px-5 py-3.5 lg:grid-cols-[1.75rem_minmax(0,1fr)_minmax(0,13rem)_auto] lg:items-center",
        className,
      )}
    >
      <span className="tabular pt-0.5 text-sm text-ink-muted lg:pt-0">
        {number !== undefined ? (
          <>
            {numberLabel ? <span className="sr-only">{numberLabel} </span> : null}
            {number}
          </>
        ) : null}
      </span>
      {children}
    </li>
  );
}

export function QueueMain({
  title,
  meta,
  lead,
}: {
  title: ReactNode;
  meta?: ReactNode;
  lead?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      {lead}
      <div className="min-w-0">
        <p className="text-sm font-semibold break-words text-ink">{title}</p>
        {meta ? (
          <p className="mt-0.5 text-sm break-words text-ink-muted">{meta}</p>
        ) : null}
      </div>
    </div>
  );
}

export function QueueSide({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <div
      id={id}
      className="col-start-2 flex min-w-0 flex-col gap-1 text-sm text-ink-muted lg:col-start-auto"
    >
      {children}
    </div>
  );
}

export const QUEUE_ACTIONS = "col-start-2 lg:col-start-auto lg:justify-end";
export const QUEUE_EXPAND = "col-[2/-1]";
