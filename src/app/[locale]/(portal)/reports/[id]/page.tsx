import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ReportDecision } from "@/components/reports/report-decision";
import { ReportStatus } from "@/components/reports/report-status";
import { Facts } from "@/components/register/facts";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { loadReport } from "@/lib/reports/data.server";
import { reportPageHref } from "@/lib/reports/schemas";
import { navHref, userHref } from "@/lib/routing/routes";

export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/reports/[id]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reports" });
  return { title: t("detailTitle") };
}
export default async function ReportPage({
  params,
}: PageProps<"/[locale]/reports/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const [t, format, loaded] = await Promise.all([
    getTranslations("reports"),
    getFormatter(),
    loadReport(id),
  ]);
  const back = { href: navHref("reports"), label: t("title") };
  if (!isReady(loaded)) {
    const failure = failureOf(loaded);
    return (
      <>
        <PageHeader title={t("detailTitle")} back={back} />
        {failure ? <LoadFailure failure={failure} /> : null}
      </>
    );
  }
  const report = loaded.data;
  const href = reportPageHref(report.pagePath, process.env.VOLONTYORLAR_APP_URL);
  return (
    <>
      <PageHeader
        title={t("detailTitle")}
        back={back}
        meta={
          <ReportStatus status={report.status} label={t(`status.${report.status}`)} />
        }
        actions={<ReportDecision report={report} />}
      />
      <section aria-label={t("details")} className="sheet px-5 py-2">
        <Facts
          items={[
            {
              term: t("reporter"),
              value: (
                <Link
                  href={userHref(report.reporter.id)}
                  className="text-primary-ink hover:underline"
                >
                  {report.reporter.displayName ?? report.reporter.username}
                </Link>
              ),
            },
            {
              term: t("submitted"),
              value: format.dateTime(new Date(report.createdAt), "stamp"),
            },
            {
              term: t("page"),
              value: href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wrap-anywhere text-primary-ink underline underline-offset-4"
                >
                  {report.pagePath}
                </a>
              ) : (
                <span className="wrap-anywhere">{report.pagePath}</span>
              ),
            },
            ...(report.resolvedAt
              ? [
                  {
                    term: t("resolved"),
                    value: t("resolution", {
                      date: format.dateTime(new Date(report.resolvedAt), "stamp"),
                      name: report.resolvedBy?.displayName ?? t("unknownAdmin"),
                    }),
                  },
                ]
              : []),
          ]}
        />
      </section>
      <section aria-labelledby="report-description" className="sheet px-5 py-5">
        <h2 id="report-description" className="text-section text-ink">
          {t("problem")}
        </h2>
        <p className="mt-3 max-w-prose text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap text-ink">
          {report.description}
        </p>
      </section>
    </>
  );
}
