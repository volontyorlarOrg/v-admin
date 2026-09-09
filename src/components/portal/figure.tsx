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
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
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
