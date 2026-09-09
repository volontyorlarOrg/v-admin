import { getTranslations } from "next-intl/server";

import { StatePanel } from "@/components/states/state-panel";

export default async function NotFound() {
  const t = await getTranslations("states.missing");

  return (
    <div className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <StatePanel role="status" title={t("title")} description={t("description")} />
      </div>
    </div>
  );
}
