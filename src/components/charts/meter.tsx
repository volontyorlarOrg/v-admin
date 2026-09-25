import { cn } from "@/lib/utils";

const TRACK = {
  neutral: "bg-chart-track",
  person: "bg-chart-person-track",
} as const;

const FILL = {
  neutral: "bg-chart-strong",
  person: "bg-chart-person",
} as const;

export function Meter({
  label,
  headline,
  caption,
  share,
  tone = "neutral",
  className,
}: {
  label: string;
  headline: string;
  caption: string;
  share: number;
  tone?: keyof typeof FILL;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="display-face tabular text-figure-inline text-ink">{headline}</p>
      <div className={cn("mt-1 h-2 rounded-r-[4px]", TRACK[tone])}>
        <div
          className={cn("h-full rounded-r-[4px]", FILL[tone])}
          style={{ inlineSize: `${share * 100}%` }}
        />
      </div>
      <p className="tabular text-sm text-ink-muted">{caption}</p>
    </div>
  );
}
