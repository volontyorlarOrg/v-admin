import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border panel-surface px-6 py-14 text-center">
      <Inbox aria-hidden="true" className="size-7 text-ink-muted" />
      <p className="text-section font-semibold text-ink">{title}</p>
      {description ? (
        <p className="max-w-md text-sm leading-relaxed text-ink-muted">{description}</p>
      ) : null}
      {actions ? <div className="mt-2 flex gap-2">{actions}</div> : null}
    </div>
  );
}
