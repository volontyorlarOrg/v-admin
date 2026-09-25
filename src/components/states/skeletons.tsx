import { HeaderGround } from "@/components/portal/ground/ground-window";
import { Skeleton } from "@/components/ui/skeleton";

function HeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <HeaderGround />
    </div>
  );
}

export function TableSkeleton({ rows = 6, label }: { rows?: number; label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col gap-6"
    >
      <span className="sr-only">{label}</span>
      <HeaderSkeleton />
      <div className="overflow-hidden sheet">
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-8 rounded-full" />
        </div>
        <div className="flex gap-2 border-b border-border px-5 py-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: rows }, (_, index) => (
            <div key={index} className="flex items-center gap-4 px-5 py-4">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="ml-auto h-4 w-16" />
            </div>
          ))}
        </div>
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
      className="flex flex-col gap-6"
    >
      <span className="sr-only">{label}</span>
      <HeaderSkeleton />
      <div className="sheet p-5">
        <Skeleton className="h-4 w-40" />
        <div className="mt-5 flex flex-col gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function QueueSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col gap-6"
    >
      <span className="sr-only">{label}</span>
      <HeaderSkeleton />
      <div className="overflow-hidden sheet">
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-8 rounded-full" />
        </div>
        {Array.from({ length: 2 }, (_, group) => (
          <div key={group} className="border-t border-border first:border-t-0">
            <div className="px-5 pt-4 pb-3">
              <Skeleton className="h-3.5 w-44" />
            </div>
            <div className="divide-y divide-border border-t border-border">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="h-4 w-5" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="hidden h-9 w-24 rounded-full sm:block" />
                  <Skeleton className="hidden h-9 w-20 rounded-full sm:block" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col gap-6"
    >
      <span className="sr-only">{label}</span>
      <HeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="sheet p-5">
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
        <div className="sheet p-5">
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
