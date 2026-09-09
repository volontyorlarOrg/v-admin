import { CircleCheck, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

export function FormMessage({
  tone,
  children,
  className,
}: {
  tone: "error" | "success";
  children: string;
  className?: string;
}) {
  const error = tone === "error";

  return (
    <p
      role={error ? "alert" : "status"}
      data-slot="form-message"
      data-tone={tone}
      className={cn(
        "flex items-start gap-2 rounded-lg border px-4 py-3 text-sm font-medium",
        error
          ? "border-danger/40 bg-danger-muted text-ink"
          : "border-primary-muted bg-surface-soft text-ink",
        className,
      )}
    >
      {error ? (
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      )}
      <span className="min-w-0">{children}</span>
    </p>
  );
}
