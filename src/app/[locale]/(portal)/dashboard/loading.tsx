import { getTranslations } from "next-intl/server";

import { QueueSkeleton } from "@/components/states/skeletons";

export default async function TodayLoading() {
  const t = await getTranslations("states.loading");
  return <QueueSkeleton label={t("queue")} />;
}
