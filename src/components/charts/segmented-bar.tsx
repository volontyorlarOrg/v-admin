import { cn } from "@/lib/utils";

export type Segment = {
  key: string;
  label: string;
  value: string;
  share: number;
  shareLabel: string;
  fill: string;
};

export function SegmentedBar({
  label,
  segments,
  emptyLabel,
  className,
}: {
  label: string;
  segments: Segment[];
  emptyLabel: string;
  className?: string;
}) {
  const filled = segments.filter((segment) => segment.share > 0);

  return (
    <div className={cn("grid gap-3", className)}>
      {filled.length === 0 ? (
        <p className="text-[0.8125rem] text-ink-muted">{emptyLabel}</p>
      ) : (
        <div
          role="img"
          aria-label={`${label}: ${filled
            .map(
              (segment) => `${segment.label} ${segment.value} (${segment.shareLabel})`,
            )
            .join(", ")}`}
          className="flex h-2.5 gap-0.5 overflow-hidden rounded-full"
        >
          {filled.map((segment) => (
            <span
              key={segment.key}
              className={cn(
                "h-full first:rounded-l-full last:rounded-r-full",
                segment.fill,
              )}
              style={{ flex: `${segment.share} 1 0%` }}
            />
          ))}
        </div>
      )}
      <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {segments.map((segment) => (
          <li
            key={segment.key}
            className="flex items-center gap-2 text-[0.8125rem] leading-6"
          >
            <span
              aria-hidden="true"
              className={cn("size-2.5 shrink-0 rounded-sm", segment.fill)}
            />
            <span className="min-w-0 flex-1 truncate text-ink-muted">
              {segment.label}
            </span>
            <span className="tabular font-semibold text-ink">{segment.value}</span>
            <span className="tabular w-11 text-right text-xs text-ink-muted">
              {segment.shareLabel}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
