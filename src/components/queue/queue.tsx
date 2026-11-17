import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function QueueRow({
  lead,
  children,
  className,
}: {
  lead?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <li
      data-lead={lead ? "" : undefined}
      className={cn(
        "group/row grid items-start gap-x-4 gap-y-2 px-4 py-3 lg:items-center",
        lead
          ? "grid-cols-[3.25rem_minmax(0,1fr)] lg:grid-cols-[3.25rem_minmax(0,1fr)_minmax(0,13rem)_auto]"
          : "grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,13rem)_auto]",
        className,
      )}
    >
      {lead ? <div className="min-w-0 pt-0.5 lg:pt-0">{lead}</div> : null}
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
          <p className="mt-0.5 text-[0.8125rem] break-words text-ink-muted">{meta}</p>
        ) : null}
      </div>
    </div>
  );
}

export function QueueSide({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <div
      id={id}
      className="col-start-1 flex min-w-0 flex-col gap-0.5 text-[0.8125rem] text-ink-muted group-data-[lead]/row:col-start-2 lg:col-start-auto lg:group-data-[lead]/row:col-start-auto"
    >
      {children}
    </div>
  );
}

export function AgeLead({
  value,
  label,
  share,
}: {
  value: string;
  label: string;
  share: number;
}) {
  return (
    <span className="flex flex-col gap-1">
      <span className="tabular text-sm leading-none font-semibold text-ink">
        <span aria-hidden="true">{value}</span>
        <span className="sr-only">{label}</span>
      </span>
      <span
        aria-hidden="true"
        className="block h-1 w-full rounded-full bg-surface-sunk"
      >
        <span
          className="block h-full rounded-full bg-ink-faint"
          style={{ inlineSize: `${Math.max(6, Math.min(1, share) * 100)}%` }}
        />
      </span>
    </span>
  );
}

export const QUEUE_ACTIONS =
  "col-start-1 group-data-[lead]/row:col-start-2 lg:col-start-auto lg:group-data-[lead]/row:col-start-auto lg:justify-end";
