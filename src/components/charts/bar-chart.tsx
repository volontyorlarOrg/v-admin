import { cn } from "@/lib/utils";

export type BarRow = {
  key: string;
  label: string;
  value: string;
  share: number;
  note?: string;
  detail?: string;
};

export function BarChart({ rows, className }: { rows: BarRow[]; className?: string }) {
  return (
    <ol className={cn("flex flex-col gap-3.5", className)}>
      {rows.map((row) => (
        <li key={row.key} className="grid gap-1.5">
          <div className="flex items-baseline justify-between gap-4">
            <span className="min-w-0 text-[0.8125rem] leading-tight">
              <span className="text-ink">{row.label}</span>
              {row.note ? (
                <span className="ml-1.5 text-xs text-ink-muted">{row.note}</span>
              ) : null}
            </span>
            <span className="tabular shrink-0 text-[0.8125rem] leading-tight font-semibold text-ink">
              {row.value}
              {row.detail ? (
                <span className="ml-1.5 font-normal text-ink-muted">{row.detail}</span>
              ) : null}
            </span>
          </div>
          <div className="h-2 rounded-r-[4px] bg-chart-track">
            <div
              className="h-full rounded-r-[4px] bg-chart-mid"
              style={{ inlineSize: `${Math.min(1, Math.max(0, row.share)) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
