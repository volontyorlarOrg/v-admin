import "server-only";

import { getTranslations } from "next-intl/server";

import type { VacancyFormLabels } from "@/components/vacancies/vacancy-form";
import { REGIONS, VACANCY_FORMATS } from "@/lib/domain/vocabulary";

const ERROR_CODES = [
  "server",
  "network",
  "timeout",
  "rateLimited",
  "unavailable",
  "forbidden",
  "notFound",
  "conflict",
  "validationFailed",
  "awaitingContract",
  "sessionExpired",
  "required",
  "tooLong",
  "slug",
  "date",
  "deadlineAfterStart",
  "endBeforeStart",
  "capacity",
  "slugUnavailable",
  "opportunityNotFound",
  "organizationNotVerified",
] as const;

export async function errorCatalog(
  codes: readonly string[] = ERROR_CODES,
): Promise<Record<string, string>> {
  const errors = await getTranslations("errors");
  return Object.fromEntries(codes.map((code) => [code, errors(code)]));
}

export async function vacancyFormLabels(
  submit: string,
  pending: string,
  success: string,
): Promise<VacancyFormLabels> {
  const t = await getTranslations("vacancies");
  const vocabulary = await getTranslations("vocabulary");
  const errors = await getTranslations("errors");

  return {
    fields: {
      title: t("fields.title"),
      slug: t("fields.slug"),
      summary: t("fields.summary"),
      description: t("fields.description"),
      organizationId: t("fields.organization"),
      region: t("fields.region"),
      format: t("fields.format"),
      city: t("fields.city"),
      locationName: t("fields.locationName"),
      startsAt: t("fields.startsAt"),
      endsAt: t("fields.endsAt"),
      applicationDeadline: t("fields.applicationDeadline"),
      capacity: t("fields.capacity"),
      requirements: t("fields.requirements"),
    },
    help: {
      slug: t("fields.slugHelp"),
      summary: t("fields.summaryHelp"),
      organizationId: t("fields.organizationHelp"),
      capacity: t("fields.capacityHelp"),
      requirements: t("fields.requirementsHelp"),
    },
    regions: Object.fromEntries(
      REGIONS.map((region) => [region, vocabulary(`regions.${region}`)]),
    ),
    formats: Object.fromEntries(
      VACANCY_FORMATS.map((format) => [format, vocabulary(`formats.${format}`)]),
    ),
    submit,
    pending,
    success,
    fallbackError: errors("server"),
    errors: await errorCatalog(),
  };
}
