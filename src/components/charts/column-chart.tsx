import { cn } from "@/lib/utils";

export type ChartColumn = {
  key: string;
  label: string;
  value: string;
  share: number;
};

export function ColumnChart({
  columns,
  peak,
  from,
  to,
  className,
}: {
  columns: ChartColumn[];
  peak: string;
  from: string;
  to: string;
  className?: string;
}) {
  const single = columns.length === 1;

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex gap-3">
        <div className="tabular flex h-32 w-8 shrink-0 flex-col justify-between text-right text-xs text-ink-muted">
          <span>{peak}</span>
          <span>0</span>
        </div>
        <ol
          className={cn(
            "flex h-32 flex-1 items-end gap-[2px] border-b border-border",
            single && "justify-center",
          )}
        >
          {columns.map((column) => (
            <li
              key={column.key}
              title={`${column.label} · ${column.value}`}
              className={cn(
                "flex h-full min-w-0 items-end",
                single ? "w-16 shrink-0" : "flex-1",
              )}
            >
              <span className="sr-only">{`${column.label} · ${column.value}`}</span>
              <span
                aria-hidden="true"
                className="w-full rounded-t-[4px] bg-chart-strong"
                style={{
                  blockSize:
                    column.share > 0 ? `${Math.max(column.share * 100, 3)}%` : "0%",
                }}
              />
            </li>
          ))}
        </ol>
      </div>
      <div className="tabular ms-11 flex justify-between text-xs text-ink-muted">
        <span>{from}</span>
        <span>{to}</span>
      </div>
    </div>
  );
}
