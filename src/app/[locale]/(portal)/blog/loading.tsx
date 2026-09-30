import { getTranslations } from "next-intl/server";

import { HeaderGround } from "@/components/portal/ground/ground-window";
import { Skeleton } from "@/components/ui/skeleton";

export default async function BlogLoading() {
  const t = await getTranslations("states.loading");
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col gap-7"
    >
      <span className="sr-only">{t("list")}</span>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-8">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <HeaderGround />
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-9 w-24 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-10 w-full rounded-full sm:w-80" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex flex-col sheet">
              <div className="flex items-center justify-between px-5 pt-4">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex flex-col gap-2 px-5 pt-4 pb-5">
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-1 h-3 w-1/2" />
              </div>
              <div className="flex flex-col gap-3 border-t border-border px-5 py-4">
                {Array.from({ length: 3 }, (_, row) => (
                  <div key={row} className="flex justify-between">
                    <Skeleton className="h-3.5 w-16" />
                    <Skeleton className="h-3.5 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
