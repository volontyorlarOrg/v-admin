import { getTranslations } from "next-intl/server";

import { TableSkeleton } from "@/components/states/skeletons";

export default async function ActivityLoading() {
  const t = await getTranslations("states.loading");
  return <TableSkeleton label={t("list")} />;
}
