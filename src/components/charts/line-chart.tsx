import { cn } from "@/lib/utils";

export type LinePoint = {
  key: string;
  label: string;
  value: string;
  share: number;
};

const TOP = 6;
const BOTTOM = 94;

function heightOf(share: number): number {
  return BOTTOM - Math.min(1, Math.max(0, share)) * (BOTTOM - TOP);
}

function across(index: number, count: number): number {
  return count < 2 ? 50 : (index / (count - 1)) * 100;
}

export function LineChart({
  points,
  peak,
  from,
  to,
  className,
}: {
  points: LinePoint[];
  peak: string;
  from: string;
  to: string;
  className?: string;
}) {
  const plotted = points.map((point, index) => ({
    ...point,
    x: across(index, points.length),
    y: heightOf(point.share),
  }));

  const last = plotted.length > 1 ? plotted.at(-1) : undefined;
  const line = plotted
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
  const area = plotted.length > 1 ? `${line} L100 ${BOTTOM} L0 ${BOTTOM} Z` : undefined;

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex gap-3">
        <div className="tabular flex h-36 w-8 shrink-0 flex-col justify-between text-right text-xs text-ink-muted">
          <span>{peak}</span>
          <span>0</span>
        </div>

        <div className="relative h-36 flex-1">
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible text-chart-strong"
          >
            {area ? <path d={area} fill="currentColor" fillOpacity="0.1" /> : null}
            <path
              d={line}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {last ? (
            <span
              aria-hidden="true"
              className="absolute size-2.5 -translate-y-1/2 rounded-full bg-chart-strong ring-2 ring-card"
              style={{ insetInlineEnd: 0, insetBlockStart: `${last.y}%` }}
            />
          ) : null}

          <ol className="sr-only">
            {points.map((point) => (
              <li key={point.key}>{`${point.label} · ${point.value}`}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="tabular ms-11 flex justify-between border-t border-border pt-2 text-xs text-ink-muted">
        <span>{from}</span>
        <span>{to}</span>
      </div>
    </div>
  );
}
