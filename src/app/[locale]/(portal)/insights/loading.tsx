import { getTranslations } from "next-intl/server";

import { DashboardSkeleton } from "@/components/states/skeletons";

export default async function InsightsLoading() {
  const t = await getTranslations("states.loading");
  return <DashboardSkeleton label={t("figures")} />;
}
