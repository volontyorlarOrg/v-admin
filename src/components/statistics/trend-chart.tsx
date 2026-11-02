"use client";

import { useLocale } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";

import { linearScale, tickIndexes } from "@/lib/statistics/scale";
import { cn } from "@/lib/utils";

export type TrendPoint = {
  date: string;
  label: string;
  value: number;
  formatted: string;
};

const HEIGHT = 192;
const TOP = 12;
const BOTTOM = 26;
const LEFT = 44;

const TONE = {
  neutral: { mark: "fill-chart-mid", stroke: "stroke-chart-mid" },
  person: { mark: "fill-chart-person", stroke: "stroke-chart-person" },
} as const;

function columnPath(x: number, y: number, width: number, height: number) {
  const radius = Math.min(4, width / 2, height);
  return [
    `M${x} ${y + height}`,
    `L${x} ${y + radius}`,
    `Q${x} ${y} ${x + radius} ${y}`,
    `L${x + width - radius} ${y}`,
    `Q${x + width} ${y} ${x + width} ${y + radius}`,
    `L${x + width} ${y + height}`,
    "Z",
  ].join(" ");
}

export function TrendChart({
  title,
  points,
  summary,
  emptyLabel,
  dataLabel,
  dateLabel,
  kind = "columns",
  tone = "neutral",
  baseline = "zero",
  integer = true,
}: {
  title: string;
  points: TrendPoint[];
  summary: string;
  emptyLabel: string;
  dataLabel: string;
  dateLabel: string;
  kind?: "columns" | "line";
  tone?: "neutral" | "person";
  baseline?: "zero" | "auto";
  integer?: boolean;
}) {
  const id = useId();
  const locale = useLocale();
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(240, Math.round(entry.contentRect.width)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const values = points.map((point) => point.value);
  const empty = values.every((value) => value === 0);
  const scale = linearScale(values, { zero: baseline === "zero", integer });
  const tick = new Intl.NumberFormat(locale, {
    notation: scale.max >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: integer ? 0 : 1,
  });

  const right = kind === "line" ? 44 : 8;
  const plotWidth = Math.max(1, width - LEFT - right);
  const plotHeight = HEIGHT - TOP - BOTTOM;
  const band = plotWidth / Math.max(1, points.length);
  const span = Math.max(1e-9, scale.max - scale.min);
  const y = (value: number) =>
    TOP + plotHeight - ((Math.max(scale.min, value) - scale.min) / span) * plotHeight;
  const x = (index: number) => LEFT + band * index + band / 2;
  const colors = TONE[tone];
  const selected = active === null ? undefined : points[active];
  const last = points.length > 0 ? points.length - 1 : null;
  const lastPoint = last === null ? undefined : points[last];

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(index)} ${y(point.value)}`)
    .join(" ");
  const area =
    points.length > 1
      ? `${line} L${x(points.length - 1)} ${TOP + plotHeight} L${x(0)} ${TOP + plotHeight} Z`
      : undefined;

  const move = (step: number | "first" | "last") =>
    setActive((current) => {
      if (points.length === 0) return null;
      if (step === "first") return 0;
      if (step === "last") return points.length - 1;
      return Math.max(
        0,
        Math.min(points.length - 1, (current ?? points.length - 1) + step),
      );
    });

  return (
    <div className="grid gap-2">
      <p
        id={`${id}-readout`}
        className="tabular min-h-5 text-[0.8125rem] text-ink-muted"
        aria-live="polite"
      >
        {selected ? (
          <>
            <span className="font-semibold text-ink">{selected.formatted}</span>
            <span> · {selected.label}</span>
          </>
        ) : empty ? (
          emptyLabel
        ) : (
          summary
        )}
      </p>
      <div
        ref={frame}
        role="group"
        aria-label={title}
        aria-describedby={`${id}-readout`}
        tabIndex={0}
        className="min-w-0 rounded-sm"
        onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const position =
            ((event.clientX - bounds.left) / bounds.width) * width - LEFT;
          const index = Math.floor(position / band);
          setActive(Math.max(0, Math.min(points.length - 1, index)));
        }}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive(points.length - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={(event) => {
          const steps: Record<string, number | "first" | "last"> = {
            ArrowLeft: -1,
            ArrowRight: 1,
            Home: "first",
            End: "last",
          };
          const step = steps[event.key];
          if (step === undefined) return;
          event.preventDefault();
          move(step);
        }}
      >
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${width} ${HEIGHT}`}
          className="block h-48 w-full overflow-visible"
        >
          {scale.ticks.map((value) => (
            <g key={value}>
              <line
                x1={LEFT}
                x2={width - right}
                y1={y(value)}
                y2={y(value)}
                className={
                  value === scale.min ? "stroke-chart-axis" : "stroke-chart-grid"
                }
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text
                x={LEFT - 8}
                y={y(value)}
                dy="0.32em"
                textAnchor="end"
                className="tabular fill-ink-muted text-[11px]"
              >
                {tick.format(value)}
              </text>
            </g>
          ))}

          {tickIndexes(points.length, width < 420 ? 3 : 5).map((index) => {
            const point = points[index];
            if (!point) return null;
            const anchor =
              index === 0 ? "start" : index === points.length - 1 ? "end" : "middle";
            const at =
              anchor === "start" ? LEFT : anchor === "end" ? width - right : x(index);
            return (
              <text
                key={point.date}
                x={at}
                y={HEIGHT - 6}
                textAnchor={anchor}
                className="tabular fill-ink-muted text-[11px]"
              >
                {point.label}
              </text>
            );
          })}

          {active !== null ? (
            <line
              x1={x(active)}
              x2={x(active)}
              y1={TOP}
              y2={TOP + plotHeight}
              className="stroke-ink-faint"
              strokeWidth={1}
              shapeRendering="crispEdges"
            />
          ) : null}

          {kind === "line" ? (
            <>
              {area && !empty && baseline === "zero" ? (
                <path d={area} className={colors.mark} fillOpacity={0.1} />
              ) : null}
              <path
                d={line}
                fill="none"
                className={colors.stroke}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {lastPoint && last !== null ? (
                <>
                  <circle
                    cx={x(last)}
                    cy={y(lastPoint.value)}
                    r={4}
                    className={cn(colors.mark, "stroke-surface")}
                    strokeWidth={2}
                  />
                  <text
                    x={x(last) + 9}
                    y={y(lastPoint.value)}
                    dy="0.32em"
                    className="tabular fill-ink text-[11px] font-semibold"
                  >
                    {lastPoint.formatted}
                  </text>
                </>
              ) : null}
              {selected && active !== null && active !== last ? (
                <circle
                  cx={x(active)}
                  cy={y(selected.value)}
                  r={4}
                  className={cn(colors.mark, "stroke-surface")}
                  strokeWidth={2}
                />
              ) : null}
            </>
          ) : (
            points.map((point, index) => {
              if (point.value <= 0) return null;
              const barWidth = Math.max(1, Math.min(24, band - 2));
              const top = y(point.value);
              const height = TOP + plotHeight - top;
              return (
                <path
                  key={point.date}
                  d={columnPath(x(index) - barWidth / 2, top, barWidth, height)}
                  className={cn(colors.mark, "transition-opacity duration-150")}
                  opacity={active === null || active === index ? 1 : 0.45}
                />
              );
            })
          )}
        </svg>
      </div>
      <details className="group border-t border-border pt-2">
        <summary className="w-fit cursor-pointer rounded-sm text-xs font-semibold text-primary-ink hover:underline">
          {dataLabel}
        </summary>
        <div className="mt-2 max-h-64 overflow-auto">
          <table className="tabular w-full text-left text-[0.8125rem]">
            <caption className="sr-only">{title}</caption>
            <thead className="sticky top-0 bg-surface">
              <tr>
                <th scope="col" className="py-1.5 font-medium text-ink-muted">
                  {dateLabel}
                </th>
                <th
                  scope="col"
                  className="py-1.5 text-right font-medium text-ink-muted"
                >
                  {title}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {points.map((point) => (
                <tr key={point.date}>
                  <th scope="row" className="py-1.5 font-normal">
                    {point.label}
                  </th>
                  <td className="py-1.5 text-right">{point.formatted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
