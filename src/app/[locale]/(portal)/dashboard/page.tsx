import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { DashboardAnalytics } from "@/components/statistics/dashboard-analytics";
import { DashboardOverview } from "@/components/statistics/dashboard-overview";
import { DashboardQueue } from "@/components/statistics/dashboard-queue";
import { PageHeader } from "@/components/states/page-header";
import { QueueSkeleton } from "@/components/states/skeletons";
import { buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { navHref } from "@/lib/routing/routes";
import { analyticsDays } from "@/lib/statistics/analytics";
import { loadAnalytics } from "@/lib/statistics/analytics.server";
import { loadStatistics } from "@/lib/statistics/data.server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboardHome" });
  return { title: t("title") };
}

export default async function DashboardPage({
  params,
  searchParams,
}: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const days = analyticsDays(await searchParams);
  const [t, statistics, analytics] = await Promise.all([
    getTranslations("dashboardHome"),
    loadStatistics(),
    loadAnalytics(days),
  ]);
  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Link
            href={`${navHref("dashboard")}#operations`}
            className={buttonClass({ size: "sm", variant: "outline" })}
          >
            {t("needsAction")}
          </Link>
        }
      />
      <DashboardOverview statistics={statistics} />
      <nav
        aria-label={t("sections")}
        className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-primary-ink"
      >
        {[
          { id: "growth", key: "growth" },
          { id: "application-analytics", key: "applications" },
          { id: "impact", key: "impact" },
        ].map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="min-h-8 content-center rounded-sm hover:underline"
          >
            {t(`categories.${section.key}`)}
          </a>
        ))}
        <Link
          href={navHref("insights")}
          className="min-h-8 content-center rounded-sm hover:underline"
        >
          {t("moreBreakdowns")}
        </Link>
      </nav>
      <DashboardAnalytics analytics={analytics} statistics={statistics} days={days} />
      <Suspense fallback={<QueueSkeleton label={t("loadingOperations")} />}>
        <DashboardQueue />
      </Suspense>
    </>
  );
}
