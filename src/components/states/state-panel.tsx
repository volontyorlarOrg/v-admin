import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StateTone = "neutral" | "notice" | "danger";

const TONE: Record<StateTone, string> = {
  neutral: "border-border bg-surface-sunk text-ink",
  notice: "border-primary-muted bg-surface-soft text-ink",
  danger: "border-danger/40 bg-danger-muted text-ink",
};

export function StatePanel({
  tone = "neutral",
  title,
  description,
  icon,
  actions,
  className,
  role,
}: {
  tone?: StateTone;
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  role?: "status" | "alert";
}) {
  return (
    <div
      role={role}
      data-slot="state-panel"
      className={cn(
        "flex flex-col items-start gap-3 rounded-xl border px-5 py-6 sm:flex-row sm:items-center",
        TONE[tone],
        className,
      )}
    >
      {icon ? <span className="shrink-0 text-ink-muted">{icon}</span> : null}
      <div className="min-w-0 flex-1">
        <p className="text-section font-semibold">{title}</p>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}
