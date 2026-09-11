import { cn } from "@/lib/utils";

export function Figure({
  label,
  value,
  tone = "neutral",
  className,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "person";
  className?: string;
}) {
  return (
    <div className={cn("panel-surface rounded-xl border border-border/70 p-5", className)}>
      <p className="eyebrow text-ink-muted">{label}</p>
      <p
        className={cn(
          "tabular mt-3 text-figure",
          tone === "person" ? "text-accent-ink" : "text-ink",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function FigureGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="eyebrow text-ink-muted">{label}</dt>
      <dd className="tabular mt-1.5 text-section font-semibold text-ink">{value}</dd>
    </div>
  );
}
