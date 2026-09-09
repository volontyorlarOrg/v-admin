import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type PageState = { page: number; pageSize: number; total: number };

export function lastPage({ pageSize, total }: PageState): number {
  return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
}

export async function Pagination({
  state,
  hrefFor,
}: {
  state: PageState;
  hrefFor: (page: number) => string;
}) {
  const t = await getTranslations("common");
  const last = lastPage(state);
  if (last <= 1) return null;

  const previousDisabled = state.page <= 1;
  const nextDisabled = state.page >= last;
  const disabled = "pointer-events-none opacity-40";

  return (
    <nav
      aria-label={t("pagination")}
      className="flex items-center justify-between gap-4 pt-2"
    >
      <Link
        href={hrefFor(state.page - 1)}
        aria-disabled={previousDisabled || undefined}
        tabIndex={previousDisabled ? -1 : undefined}
        className={cn(
          buttonClass({ variant: "outline", size: "sm" }),
          previousDisabled && disabled,
        )}
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        {t("previous")}
      </Link>

      <p aria-live="polite" className="tabular text-sm text-ink-muted">
        {t("pageOf", { page: state.page, last, total: state.total })}
      </p>

      <Link
        href={hrefFor(state.page + 1)}
        aria-disabled={nextDisabled || undefined}
        tabIndex={nextDisabled ? -1 : undefined}
        className={cn(
          buttonClass({ variant: "outline", size: "sm" }),
          nextDisabled && disabled,
        )}
      >
        {t("next")}
        <ChevronRight aria-hidden="true" className="size-4" />
      </Link>
    </nav>
  );
}
