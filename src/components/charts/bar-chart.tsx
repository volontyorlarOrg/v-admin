import { cn } from "@/lib/utils";

export type BarRow = {
  key: string;
  label: string;
  value: string;
  share: number;
};

export function BarChart({ rows, className }: { rows: BarRow[]; className?: string }) {
  return (
    <ol className={cn("flex flex-col gap-4", className)}>
      {rows.map((row) => (
        <li key={row.key} className="grid gap-2">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm leading-tight text-ink-muted">{row.label}</span>
            <span className="tabular text-sm leading-tight font-semibold text-ink">
              {row.value}
            </span>
          </div>
          <div className="h-2 rounded-r-[4px] bg-surface-sunk">
            <div
              className="h-full rounded-r-[4px] bg-chart-strong"
              style={{ inlineSize: `${row.share * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
