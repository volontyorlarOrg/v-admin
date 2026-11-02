import { Skeleton } from "@/components/ui/skeleton";

function HeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-80 max-w-full" />
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
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-8 rounded-md" />
        </div>
        <div className="flex gap-2 border-b border-border px-4 py-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-24 rounded-md" />
          ))}
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: rows }, (_, index) => (
            <div key={index} className="flex items-center gap-4 px-4 py-4">
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

function JourneySkeleton() {
  return (
    <div className="overflow-hidden sheet">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3.5 w-40" />
      </div>
      <div className="grid gap-6 px-4 py-5 lg:grid-cols-5 lg:gap-0">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex gap-3 lg:flex-col lg:px-3">
            <Skeleton className="size-[1.125rem] shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-7 w-14" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DeskSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col gap-6"
    >
      <span className="sr-only">{label}</span>
      <JourneySkeleton />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-start">
        <div className="overflow-hidden sheet">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-6 rounded-sm" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-center gap-4 px-4 py-3.5">
                <Skeleton className="h-4 w-10" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="hidden h-8 w-24 rounded-md sm:block" />
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-hidden sheet">
          <div className="border-b border-border px-4 py-3">
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex gap-3 px-4 py-3">
                <Skeleton className="h-4 w-10" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-6">
      <HeaderSkeleton />
      <DeskSkeleton label={label} />
    </div>
  );
}
