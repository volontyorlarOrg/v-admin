import { getTranslations } from "next-intl/server";

import { policyHref } from "@/lib/legal/marketing";

export async function PolicyLinks({ locale }: { locale: string }) {
  const privacy = policyHref(locale, "privacy");
  const terms = policyHref(locale, "terms");
  if (!privacy || !terms) return null;
  const t = await getTranslations({ locale, namespace: "policy" });
  return (
    <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
      <a href={privacy} className="underline underline-offset-4 hover:text-ink">
        {t("privacy")}
      </a>
      <a href={terms} className="underline underline-offset-4 hover:text-ink">
        {t("terms")}
      </a>
    </p>
  );
}
