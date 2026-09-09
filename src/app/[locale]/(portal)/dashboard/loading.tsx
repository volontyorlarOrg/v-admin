import { getTranslations } from "next-intl/server";

import { FigureSkeleton } from "@/components/states/skeletons";

export default async function DashboardLoading() {
  const t = await getTranslations("states.loading");
  return <FigureSkeleton label={t("figures")} count={8} />;
}
