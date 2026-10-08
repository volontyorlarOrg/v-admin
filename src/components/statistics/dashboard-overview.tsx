import { getFormatter, getTranslations } from "next-intl/server";
import { LoadFailure } from "@/components/states/load-failure";
import { failureOf, isReady, type Loaded } from "@/lib/api/load";
import type { Statistics } from "@/lib/api/schemas";
import { cn } from "@/lib/utils";

export async function DashboardOverview({
  statistics,
}: {
  statistics: Loaded<Statistics>;
}) {
  const [t, format] = await Promise.all([
    getTranslations("dashboardHome"),
    getFormatter(),
  ]);
  const failure = failureOf(statistics);
  const totals = isReady(statistics) ? statistics.data.totals : null;
  const keys = [
    "volunteers",
    "publishedVacancies",
    "applications",
    "attended",
    "confirmedHours",
  ] as const;
  return (
    <section
      id="overview"
      aria-labelledby="overview-title"
      className="overflow-hidden sheet"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-5 py-3.5">
        <h2 id="overview-title" className="text-section text-ink">
          {t("overview.title")}
        </h2>
        <p className="text-xs text-ink-muted">{t("overview.description")}</p>
      </header>
      {totals ? (
        <dl className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
          {keys.map((key) => (
            <div key={key} className="min-w-0 px-5 py-5">
              <dt className="text-sm text-ink-muted">{t(`overview.${key}`)}</dt>
              <dd
                className={cn(
                  "display-face tabular mt-2 text-3xl",
                  key === "confirmedHours" ? "text-accent-ink" : "text-ink",
                )}
              >
                {totals[key] === undefined
                  ? "—"
                  : format.number(totals[key], { maximumFractionDigits: 2 })}
              </dd>
            </div>
          ))}
        </dl>
      ) : failure ? (
        <div className="p-5">
          <LoadFailure failure={failure} />
        </div>
      ) : null}
    </section>
  );
}
