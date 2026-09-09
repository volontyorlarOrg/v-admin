import { getTranslations } from "next-intl/server";

import { TableSkeleton } from "@/components/states/skeletons";

export default async function CoordinatorsLoading() {
  const t = await getTranslations("states.loading");
  return <TableSkeleton label={t("list")} />;
}
