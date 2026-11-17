import type { ReactNode } from "react";

export function TodayHeader({
  date,
  headline,
  detail,
  actions,
}: {
  date: string;
  headline: string;
  detail?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-x-8">
      <div className="max-w-3xl min-w-0">
        <p className="text-sm font-medium text-ink-muted">{date}</p>
        <h1 className="mt-1.5 text-display-compact text-balance text-ink sm:text-display">
          {headline}
        </h1>
        {detail ? (
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-pretty text-ink-muted">
            {detail}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
