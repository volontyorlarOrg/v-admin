import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Panel({
  id,
  title,
  description,
  scope,
  actions,
  children,
  className,
  bodyClassName,
}: {
  id?: string;
  title?: string;
  description?: string;
  scope?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const titleId = id ? `${id}-title` : undefined;

  return (
    <section
      id={id}
      aria-labelledby={title ? titleId : undefined}
      className={cn("min-w-0 sheet", className)}
    >
      {title ? (
        <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 id={titleId} className="text-section text-ink">
                {title}
              </h2>
              {scope ? (
                <span className="inline-flex h-5 items-center rounded-sm bg-surface-sunk px-1.5 text-xs font-medium text-ink-muted">
                  {scope}
                </span>
              ) : null}
            </div>
            {description ? (
              <p className="mt-0.5 text-sm leading-snug text-ink-muted">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("px-4 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}
