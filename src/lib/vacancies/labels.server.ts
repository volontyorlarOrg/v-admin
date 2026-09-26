import "server-only";

import { getTranslations } from "next-intl/server";

import type { VacancyFieldLabels } from "@/components/vacancies/vacancy-fields";
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
  "estimatedHours",
  "competitionHoursNotAllowed",
  "opportunityKindLocked",
  "cityRequired",
  "venueRequired",
  "onlineLocationRequired",
  "onlineLocationCredentials",
  "slugUnavailable",
  "opportunityNotFound",
  "organizationNotVerified",
  "opportunityNotReadyForApproval",
  "opportunityNotSubmittable",
  "opportunityNotPending",
  "decisionNoteRequired",
  "opportunityIncomplete",
  "opportunityCannotBeSubmitted",
  "opportunityCannotBePublished",
  "opportunityNotPendingApproval",
  "opportunityNotEditable",
  "opportunityImageInvalid",
  "opportunityImageTooLarge",
  "opportunityImageFormatUnsupported",
  "opportunityImageTooSmall",
  "opportunityImageStorageUnavailable",
  "vacancyImageAfterSaveFailed",
  "approvalNoteRequired",
  "deadlinePassed",
  "invalidOpportunityDates",
] as const;

export async function errorCatalog(
  codes: readonly string[] = ERROR_CODES,
): Promise<Record<string, string>> {
  const errors = await getTranslations("errors");
  return Object.fromEntries(codes.map((code) => [code, errors(code)]));
}

async function vacancyFieldLabels(): Promise<VacancyFieldLabels> {
  const t = await getTranslations("vacancies");
  const vocabulary = await getTranslations("vocabulary");

  return {
    kinds: {
      volunteering: t("kinds.volunteering"),
      competition: t("kinds.competition"),
    },
    fields: {
      title: t("fields.title"),
      kind: t("fields.kind"),
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
      estimatedTotalHours: t("fields.estimatedTotalHours"),
      acceptanceMode: t("fields.acceptanceMode"),
      essayRequired: t("fields.essayRequired"),
      requirements: t("fields.requirements"),
      image: t("image.choose"),
    },
    help: {
      kind: t("fields.kindHelp"),
      organizationId: t("fields.organizationHelp"),
      capacity: t("fields.capacityHelp"),
      estimatedTotalHours: t("fields.estimatedTotalHoursHelp"),
      city: t("fields.cityHelp"),
      locationName: t("fields.locationNameHelp"),
      requirements: t("fields.requirementsHelp"),
      acceptanceMode: t("fields.acceptanceModeHelp"),
      essayRequired: t("fields.essayRequiredHelp"),
    },
    sections: {
      about: t("form.sections.about"),
      organization: t("form.sections.organization"),
      place: t("form.sections.place"),
      when: t("form.sections.when"),
      volunteers: t("form.sections.volunteers"),
    },
    sectionHelp: {
      about: t("form.sectionHelp.about"),
      organization: t("form.sectionHelp.organization"),
      place: t("form.sectionHelp.place"),
      when: t("form.sectionHelp.when"),
      volunteers: t("form.sectionHelp.volunteers"),
    },
    unverified: t("form.unverified"),
    unverifiedNotice: t("form.unverifiedNotice"),
    choose: t("form.choose"),
    regions: Object.fromEntries(
      REGIONS.map((region) => [region, vocabulary(`regions.${region}`)]),
    ),
    formats: Object.fromEntries(
      VACANCY_FORMATS.map((format) => [format, vocabulary(`formats.${format}`)]),
    ),
    acceptanceModes: {
      manual: {
        label: vocabulary("acceptanceModes.manual"),
        description: t("fields.acceptanceModes.manual"),
      },
      automatic: {
        label: vocabulary("acceptanceModes.automatic"),
        description: t("fields.acceptanceModes.automatic"),
      },
    },
    errors: await errorCatalog(),
  };
}

export async function vacancyFormLabels(
  submit: string,
  pending: string,
  success: string,
): Promise<VacancyFormLabels> {
  const common = await getTranslations("common");
  const errors = await getTranslations("errors");
  const vacancies = await getTranslations("vacancies");
  const fieldLabels = await vacancyFieldLabels();

  return {
    ...fieldLabels,
    image: {
      title: vacancies("image.title"),
      description: vacancies("image.description"),
      choose: vacancies("image.choose"),
      remove: vacancies("image.remove"),
      undoRemove: vacancies("image.undoRemove"),
      noImage: vacancies("image.noImage"),
      errors: fieldLabels.errors,
    },
    submit,
    pending,
    success,
    cancel: common("cancel"),
    summary: common("fixFields"),
    fallbackError: errors("server"),
  };
}
