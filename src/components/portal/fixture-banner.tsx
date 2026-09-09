import { FlaskConical } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { fixtureModeEnabled } from "@/lib/auth/config";

export async function FixtureBanner() {
  if (!fixtureModeEnabled()) return null;

  const t = await getTranslations("common");

  return (
    <p
      role="status"
      className="flex items-center justify-center gap-2 bg-accent px-4 py-2 text-center text-sm font-semibold text-knockout"
    >
      <FlaskConical aria-hidden="true" className="size-4 shrink-0" />
      {t("fixtureMode")}
    </p>
  );
}
