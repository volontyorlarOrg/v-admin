import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { Figure, FigureGrid } from "@/components/portal/figure";
import { Panel } from "@/components/portal/panel";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { loadStatistics } from "@/lib/statistics/data.server";
import { navHref } from "@/lib/routing/routes";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("title") };
}

export default async function DashboardPage({
  params,
}: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("dashboard");
  const format = await getFormatter();
  const statistics = await loadStatistics();
  const failure = failureOf(statistics);

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      {failure ? <LoadFailure failure={failure} /> : null}

      {isReady(statistics) ? (
        <>
          <p className="tabular text-sm text-ink-muted">
            {t("range", {
              from: format.dateTime(new Date(statistics.data.range.from), "date"),
              to: format.dateTime(new Date(statistics.data.range.to), "date"),
            })}
          </p>

          <FigureGrid>
            <Figure
              label={t("figures.vacancies")}
              value={format.number(statistics.data.totals.vacancies)}
            />
            <Figure
              label={t("figures.publishedVacancies")}
              value={format.number(statistics.data.totals.publishedVacancies)}
            />
            <Figure
              label={t("figures.applications")}
              value={format.number(statistics.data.totals.applications)}
            />
            <Figure
              label={t("figures.pendingReview")}
              value={format.number(statistics.data.totals.pendingReview)}
            />
            <Figure
              label={t("figures.accepted")}
              value={format.number(statistics.data.totals.accepted)}
              tone="person"
            />
            <Figure
              label={t("figures.awaitingAttendance")}
              value={format.number(statistics.data.totals.awaitingAttendance)}
            />
            <Figure
              label={t("figures.attended")}
              value={format.number(statistics.data.totals.attended)}
              tone="person"
            />
            <Figure
              label={t("figures.confirmedHours")}
              value={format.number(statistics.data.totals.confirmedHours)}
              tone="person"
            />
            {statistics.data.totals.volunteers === undefined ? null : (
              <Figure
                label={t("figures.volunteers")}
                value={format.number(statistics.data.totals.volunteers)}
              />
            )}
          </FigureGrid>

          {statistics.data.totals.coordinators ? (
            <Panel
              title={t("coordinators.title")}
              actions={
                <Link
                  href={navHref("coordinators")}
                  className={buttonClass({ variant: "outline", size: "sm" })}
                >
                  {t("coordinators.title")}
                </Link>
              }
            >
              <FigureGrid>
                <Figure
                  label={t("coordinators.active")}
                  value={format.number(statistics.data.totals.coordinators.active)}
                />
                <Figure
                  label={t("coordinators.blocked")}
                  value={format.number(statistics.data.totals.coordinators.blocked)}
                />
                <Figure
                  label={t("coordinators.removed")}
                  value={format.number(statistics.data.totals.coordinators.removed)}
                />
              </FigureGrid>
            </Panel>
          ) : null}

          <Panel title={t("next.title")}>
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  href={`${navHref("applications")}?status=submitted`}
                  className={buttonClass({ variant: "outline", size: "sm" })}
                >
                  {t("next.review", { count: statistics.data.totals.pendingReview })}
                </Link>
              </li>
              <li>
                <Link
                  href={navHref("attendance")}
                  className={buttonClass({ variant: "outline", size: "sm" })}
                >
                  {t("next.attendance", {
                    count: statistics.data.totals.awaitingAttendance,
                  })}
                </Link>
              </li>
            </ul>
          </Panel>
        </>
      ) : null}
    </>
  );
}
