import type { ReactNode } from "react";

import { Count } from "@/components/register/register";
import { cn } from "@/lib/utils";

export function WorkCard({
  id,
  title,
  count,
  countLabel,
  note,
  footer,
  children,
  className,
}: {
  id: string;
  title: string;
  count: number;
  countLabel: string;
  note?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn("flex min-w-0 flex-col overflow-hidden sheet", className)}
    >
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1 px-5 pt-4 pb-3">
        <h3 id={`${id}-title`} className="text-section text-ink">
          {title}
        </h3>
        <Count value={count} label={countLabel} tone="waiting" />
        {note ? <p className="ml-auto text-xs text-ink-muted">{note}</p> : null}
      </header>
      <ol className="divide-y divide-border border-t border-border">{children}</ol>
      {footer ? (
        <div className="mt-auto border-t border-border px-5 py-2.5">{footer}</div>
      ) : null}
    </section>
  );
}

export function WorkItem({
  lead,
  title,
  meta,
  facts,
  actions,
}: {
  lead?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  facts?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <li
      className={cn(
        "grid items-start gap-x-4 px-5 py-3.5",
        lead ? "grid-cols-[2.75rem_minmax(0,1fr)]" : "grid-cols-[minmax(0,1fr)]",
      )}
    >
      {lead ? <div className="min-w-0 pt-0.5">{lead}</div> : null}
      <div className="flex min-w-0 flex-col gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold break-words text-ink">{title}</p>
          {meta ? (
            <p className="mt-0.5 text-[0.8125rem] break-words text-ink-muted">{meta}</p>
          ) : null}
          {facts ? (
            <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.8125rem] text-ink-muted">
              {facts}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex min-w-0 flex-col gap-2">{actions}</div> : null}
      </div>
    </li>
  );
}
