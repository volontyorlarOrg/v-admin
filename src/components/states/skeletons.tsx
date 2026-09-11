import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 6, label }: { rows?: number; label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="rounded-xl border border-border/70 panel-surface"
    >
      <span className="sr-only">{label}</span>
      <div className="border-b border-border px-5 py-3">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PanelSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="rounded-xl border border-border/70 panel-surface p-5"
    >
      <span className="sr-only">{label}</span>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-8 w-24" />
      <Skeleton className="mt-3 h-4 w-full" />
    </div>
  );
}

export function FigureSkeleton({
  label,
  count = 4,
}: {
  label: string;
  count?: number;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="rounded-xl border border-border/70 panel-surface p-5"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="grid gap-6">
      <span className="sr-only">{label}</span>
      <div className="rounded-xl border border-border/70 panel-surface p-5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-4 h-12 w-40" />
        <Skeleton className="mt-4 h-3 w-52" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="rounded-xl border border-border/70 panel-surface p-5">
          <Skeleton className="h-4 w-40" />
          <div className="mt-6 flex flex-col gap-5">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="grid gap-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/70 panel-surface p-5">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="mt-6 grid gap-2 first:mt-0">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
