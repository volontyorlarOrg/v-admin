"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export type TrendPoint = {
  date: string;
  label: string;
  value: number;
  formatted: string;
};

const WIDTH = 600;
const HEIGHT = 180;
const TOP = 8;
const BOTTOM = 172;

export function TrendChart({
  title,
  points,
  peakLabel,
  hint,
  dataLabel,
  dateLabel,
  kind = "columns",
  tone = "neutral",
}: {
  title: string;
  points: TrendPoint[];
  peakLabel: string;
  hint: string;
  dataLabel: string;
  dateLabel: string;
  kind?: "columns" | "line";
  tone?: "neutral" | "person";
}) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const peak = Math.max(0, ...points.map((point) => point.value));
  const unit = WIDTH / Math.max(1, points.length);
  const x = (index: number) => (index + 0.5) * unit;
  const y = (value: number) => BOTTOM - (peak > 0 ? value / peak : 0) * (BOTTOM - TOP);
  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(index)} ${y(point.value)}`)
    .join(" ");
  const selected = active === null ? undefined : points[active];

  return (
    <div className="grid gap-3">
      <p
        id={`${id}-hint`}
        className="tabular min-h-5 text-xs text-ink-muted"
        aria-live="polite"
      >
        {selected ? (
          <span className="font-semibold text-ink">
            {selected.label} · {selected.formatted}
          </span>
        ) : (
          hint
        )}
      </p>
      <div className="flex gap-2">
        <div
          aria-hidden="true"
          className="tabular flex h-44 w-10 shrink-0 flex-col justify-between text-right text-xs text-ink-muted"
        >
          <span>{peakLabel}</span>
          <span>0</span>
        </div>
        <div
          role="group"
          aria-label={title}
          aria-describedby={`${id}-hint`}
          tabIndex={0}
          className={cn(
            "min-w-0 flex-1 rounded-sm",
            tone === "person" ? "text-chart-person" : "text-chart-strong",
          )}
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const index = Math.floor(
              ((event.clientX - bounds.left) / bounds.width) * points.length,
            );
            setActive(Math.max(0, Math.min(points.length - 1, index)));
          }}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(points.length - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            setActive((current) => {
              if (event.key === "Home") return 0;
              if (event.key === "End") return points.length - 1;
              return Math.max(
                0,
                Math.min(
                  points.length - 1,
                  (current ?? points.length - 1) + (event.key === "ArrowLeft" ? -1 : 1),
                ),
              );
            });
          }}
        >
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="none"
            className="h-44 w-full"
          >
            {[TOP, (TOP + BOTTOM) / 2, BOTTOM].map((position) => (
              <line
                key={position}
                x1={0}
                x2={WIDTH}
                y1={position}
                y2={position}
                className="stroke-border"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {kind === "line" ? (
              <path
                d={line}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            ) : (
              points.map((point, index) => (
                <rect
                  key={point.date}
                  x={index * unit + unit * 0.15}
                  y={y(point.value)}
                  width={unit * 0.7}
                  height={BOTTOM - y(point.value)}
                  fill="currentColor"
                  opacity={active === null || active === index ? 1 : 0.45}
                  rx={1}
                />
              ))
            )}
            {active !== null && selected ? (
              <>
                <line
                  x1={x(active)}
                  x2={x(active)}
                  y1={TOP}
                  y2={BOTTOM}
                  stroke="currentColor"
                  strokeDasharray="3 4"
                  opacity={0.5}
                  vectorEffect="non-scaling-stroke"
                />
                {kind === "line" ? (
                  <circle
                    cx={x(active)}
                    cy={y(selected.value)}
                    r={4}
                    fill="currentColor"
                  />
                ) : null}
              </>
            ) : null}
          </svg>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="tabular ms-12 flex justify-between gap-4 text-xs text-ink-muted"
      >
        <span>{points[0]?.label}</span>
        <span>{points.at(-1)?.label}</span>
      </div>
      <details className="mt-1 border-t border-border pt-3">
        <summary className="w-fit cursor-pointer rounded-sm text-xs font-semibold text-primary-ink hover:underline">
          {dataLabel}
        </summary>
        <div className="mt-3 max-h-64 overflow-auto">
          <table className="tabular w-full text-left text-sm">
            <caption className="sr-only">{title}</caption>
            <thead className="sticky top-0 bg-surface">
              <tr>
                <th scope="col" className="py-2 font-medium text-ink-muted">
                  {dateLabel}
                </th>
                <th scope="col" className="py-2 text-right font-medium text-ink-muted">
                  {title}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {points.map((point) => (
                <tr key={point.date}>
                  <th scope="row" className="py-2 font-normal">
                    {point.label}
                  </th>
                  <td className="py-2 text-right">{point.formatted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
