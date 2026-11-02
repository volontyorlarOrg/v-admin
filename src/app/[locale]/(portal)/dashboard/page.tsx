import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { DashboardDesk } from "@/components/dashboard/desk";
import { DashboardOverview } from "@/components/dashboard/overview";
import { DashboardAnalytics } from "@/components/statistics/dashboard-analytics";
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
  const [t, nav, statistics, analytics] = await Promise.all([
    getTranslations("dashboardHome"),
    getTranslations("nav"),
    loadStatistics(),
    loadAnalytics(days),
  ]);

  const jumps = [
    { href: "#operations", label: t("jump.operations") },
    { href: "#activity", label: t("jump.activity") },
    { href: "#growth", label: t("categories.growth") },
    { href: "#application-analytics", label: t("categories.applications") },
    { href: "#impact", label: t("categories.impact") },
  ];

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Link
              href={navHref("insights")}
              className={buttonClass({ size: "sm", variant: "outline" })}
            >
              {nav("insights")}
            </Link>
            <Link
              href={navHref("audit")}
              className={buttonClass({ size: "sm", variant: "outline" })}
            >
              {nav("audit")}
            </Link>
          </>
        }
      />
      <DashboardOverview
        statistics={statistics}
        figures={[
          "volunteers",
          "publishedVacancies",
          "applications",
          "attended",
          "confirmedHours",
        ]}
      />
      <nav
        aria-label={t("sections")}
        className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-primary-ink"
      >
        {jumps.map((jump) => (
          <a
            key={jump.href}
            href={jump.href}
            className="min-h-8 content-center rounded-sm hover:underline"
          >
            {jump.label}
          </a>
        ))}
      </nav>
      <Suspense fallback={<QueueSkeleton label={t("loadingOperations")} />}>
        <DashboardDesk />
      </Suspense>
      <DashboardAnalytics analytics={analytics} statistics={statistics} days={days} />
    </>
  );
}
