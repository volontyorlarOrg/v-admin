import "server-only";

import { getTranslations } from "next-intl/server";

import { isLocale, type Locale, defaultLocale } from "@/i18n/routing";
import { REGIONS } from "@/lib/domain/vocabulary";
import { EXPORT_FIELDS, type ExportList } from "@/lib/exports/schemas";

const STATUSES = [
  "submitted",
  "under_review",
  "accepted",
  "rejected",
  "withdrawn",
  "closed",
] as const;
const OUTCOMES = ["attended", "excused", "no_show", "cancelled"] as const;
const PLACEMENTS = ["winner", "contributor", "attendee"] as const;

export type ExportLabels = {
  title: string;
  subtitle: string;
  columns: Record<string, string>;
  values: Record<string, string>;
};

export function exportLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export async function exportLabels(
  locale: Locale,
  list: ExportList,
  vacancyTitle: string,
  now = new Date(),
): Promise<ExportLabels> {
  const [t, status, vocabulary, sheet] = await Promise.all([
    getTranslations({ locale, namespace: "exports" }),
    getTranslations({ locale, namespace: "applications.status" }),
    getTranslations({ locale, namespace: "vocabulary" }),
    getTranslations({ locale, namespace: "results.sheet" }),
  ]);
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "Asia/Tashkent",
  }).format(now);
  return {
    title: vacancyTitle,
    subtitle: t("subtitle", { list: t(`lists.${list}`), date }),
    columns: Object.fromEntries(
      EXPORT_FIELDS.map((field) => [field, t(`field.${field}`)]),
    ),
    values: {
      yes: t("yes"),
      "outcome.awaiting_confirmation": sheet("notRecorded"),
      ...Object.fromEntries(
        REGIONS.map((region) => [`region.${region}`, vocabulary(`regions.${region}`)]),
      ),
      ...Object.fromEntries(
        STATUSES.map((value) => [`status.${value}`, status(value)]),
      ),
      ...Object.fromEntries(
        OUTCOMES.map((value) => [`outcome.${value}`, sheet(`outcome.${value}`)]),
      ),
      ...Object.fromEntries(
        PLACEMENTS.map((value) => [`placement.${value}`, sheet(`placement.${value}`)]),
      ),
    },
  };
}
