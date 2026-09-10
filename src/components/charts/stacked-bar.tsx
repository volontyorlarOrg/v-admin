import { cn } from "@/lib/utils";

const FILL = {
  strong: "bg-chart-strong",
  mid: "bg-chart-mid",
  soft: "bg-chart-soft",
} as const;

export type StackSegment = {
  key: string;
  label: string;
  value: string;
  share: number;
  tone: keyof typeof FILL;
};

export function StackedBar({
  segments,
  className,
}: {
  segments: StackSegment[];
  className?: string;
}) {
  const filled = segments.filter((segment) => segment.share > 0);

  return (
    <div className={cn("grid gap-4", className)}>
      <div className="flex h-3 gap-[2px]">
        {filled.map((segment) => (
          <div
            key={segment.key}
            className={cn(
              "h-full first:rounded-l-[4px] last:rounded-r-[4px]",
              FILL[segment.tone],
            )}
            style={{ flex: `0 1 ${segment.share * 100}%` }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className={cn("size-2.5 shrink-0 rounded-full", FILL[segment.tone])}
            />
            <span className="text-ink-muted">{segment.label}</span>
            <span className="tabular font-semibold text-ink">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
