import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ReportDecision } from "@/components/reports/report-decision";
import { ReportStatus } from "@/components/reports/report-status";
import { Register, RegisterNote, RegisterTabs } from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Pagination } from "@/components/states/pagination";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { loadReports } from "@/lib/reports/data.server";
import { REPORT_VIEWS } from "@/lib/reports/schemas";
import { navHref, reportHref, userHref } from "@/lib/routing/routes";
import {
  hrefWith,
  readOption,
  readPage,
  DEFAULT_PAGE_SIZE,
} from "@/lib/routing/search-params";

export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/reports">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reports" });
  return { title: t("title") };
}
export default async function ReportsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/reports">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const view = readOption(query, "view", REPORT_VIEWS) ?? "open";
  const page = Math.min(readPage(query), 1_000);
  const [t, format, loaded] = await Promise.all([
    getTranslations("reports"),
    getFormatter(),
    loadReports(view, page, DEFAULT_PAGE_SIZE),
  ]);
  const failure = failureOf(loaded);
  const path = navHref("reports");
  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      {failure ? <LoadFailure failure={failure} /> : null}
      {isReady(loaded) ? (
        <Register
          id="reports"
          title={t(`views.${view}`)}
          count={loaded.data.total}
          countLabel={t("countLabel")}
          countTone={view === "open" ? "waiting" : "neutral"}
          toolbar={
            <RegisterTabs
              label={t("filterLabel")}
              items={REPORT_VIEWS.map((option) => ({
                key: option,
                label: t(`views.${option}`),
                href: hrefWith(path, { view: option }),
                active: view === option,
              }))}
            />
          }
        >
          {loaded.data.items.length === 0 ? (
            <RegisterNote
              title={t(`empty.${view}`)}
              description={t("empty.description")}
            />
          ) : (
            <ul className="divide-y divide-border">
              {loaded.data.items.map((report) => (
                <li
                  key={report.id}
                  className="flex min-w-0 flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ReportStatus
                        status={report.status}
                        label={t(`status.${report.status}`)}
                      />
                      <time
                        dateTime={report.createdAt}
                        className="text-xs text-ink-muted"
                      >
                        {format.dateTime(new Date(report.createdAt), "stamp")}
                      </time>
                    </div>
                    <Link
                      href={reportHref(report.id)}
                      className="mt-2 block rounded-sm font-medium text-ink hover:text-primary-ink"
                    >
                      <span className="line-clamp-2 wrap-anywhere whitespace-pre-wrap">
                        {report.description}
                      </span>
                      <span className="sr-only"> — {t("viewReport")}</span>
                    </Link>
                    <p className="mt-2 text-sm text-ink-muted">
                      <Link
                        href={userHref(report.reporter.id)}
                        className="font-medium text-primary-ink hover:underline"
                      >
                        {report.reporter.displayName ?? report.reporter.username}
                      </Link>
                    </p>
                    <p className="mt-1 text-xs wrap-anywhere text-ink-muted">
                      {report.pagePath}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <ReportDecision report={report} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="px-4 pb-3">
            <Pagination
              state={loaded.data}
              hrefFor={(next) => hrefWith(path, { view, page: next })}
            />
          </div>
        </Register>
      ) : null}
    </>
  );
}
