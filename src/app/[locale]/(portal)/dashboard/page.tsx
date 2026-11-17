import { Plus } from "lucide-react";
import { Suspense } from "react";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { DashboardDesk } from "@/components/dashboard/desk";
import { TodayHeader } from "@/components/dashboard/today-header";
import { DeskSkeleton } from "@/components/states/skeletons";
import { buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { navHref } from "@/lib/routing/routes";
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
}: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, vacancies, format, statistics] = await Promise.all([
    getTranslations("dashboardHome"),
    getTranslations("vacancies"),
    getFormatter(),
    loadStatistics(),
  ]);

  const actions = (
    <Link href={navHref("newVacancy")} className={buttonClass({ size: "sm" })}>
      <Plus aria-hidden="true" />
      {vacancies("new")}
    </Link>
  );

  return (
    <Suspense
      fallback={
        <>
          <TodayHeader
            date={format.dateTime(new Date(), {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            headline={t("title")}
            actions={actions}
          />
          <DeskSkeleton label={t("loadingOperations")} />
        </>
      }
    >
      <DashboardDesk statistics={statistics} title={t("title")} actions={actions} />
    </Suspense>
  );
}
