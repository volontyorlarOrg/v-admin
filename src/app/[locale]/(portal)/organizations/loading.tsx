import { getTranslations } from "next-intl/server";

import { PanelSkeleton } from "@/components/states/skeletons";

export default async function OrganizationsLoading() {
  const t = await getTranslations("states.loading");
  return <PanelSkeleton label={t("panel")} />;
}
