import "server-only";

import { getTranslations } from "next-intl/server";

import type { VacancyDialogLabels } from "@/components/vacancies/vacancy-dialog";
import type { VacancyFieldLabels } from "@/components/vacancies/vacancy-fields";
import type { VacancyFormLabels } from "@/components/vacancies/vacancy-form";
import type {
  VacancyDecisionLabels,
  VacancyWorkflowLabels,
} from "@/components/vacancies/vacancy-workflow";
import { REGIONS, VACANCY_FORMATS } from "@/lib/domain/vocabulary";
import { APPROVAL_REQUIREMENTS } from "@/lib/vacancies/approval";

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
  "opportunityNotPendingApproval",
  "opportunityNotEditable",
  "approvalNoteRequired",
  "deadlinePassed",
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
      estimatedTotalHours: t("fields.estimatedTotalHours"),
      requirements: t("fields.requirements"),
    },
    help: {
      slug: t("fields.slugHelp"),
      summary: t("fields.summaryHelp"),
      organizationId: t("fields.organizationHelp"),
      capacity: t("fields.capacityHelp"),
      estimatedTotalHours: t("fields.estimatedTotalHoursHelp"),
      locationName: t("fields.locationNameHelp"),
      city: t("fields.cityHelp"),
      requirements: t("fields.requirementsHelp"),
    },
    sections: {
      about: t("form.sections.about"),
      organization: t("form.sections.organization"),
      place: t("form.sections.place"),
      when: t("form.sections.when"),
      volunteers: t("form.sections.volunteers"),
    },
    unverified: t("form.unverified"),
    unverifiedNotice: t("form.unverifiedNotice"),
    regions: Object.fromEntries(
      REGIONS.map((region) => [region, vocabulary(`regions.${region}`)]),
    ),
    formats: Object.fromEntries(
      VACANCY_FORMATS.map((format) => [format, vocabulary(`formats.${format}`)]),
    ),
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

  return {
    ...(await vacancyFieldLabels()),
    submit,
    pending,
    success,
    summary: common("fixFields"),
    fallbackError: errors("server"),
  };
}

export async function vacancyDialogLabels(
  mode: "create" | "edit",
): Promise<VacancyDialogLabels> {
  const t = await getTranslations("vacancies");
  const common = await getTranslations("common");
  const errors = await getTranslations("errors");

  const creating = mode === "create";

  return {
    ...(await vacancyFieldLabels()),
    title: creating ? t("form.createTitle") : t("form.editTitle"),
    description: creating ? t("form.createDescription") : t("form.editDescription"),
    submit: creating ? t("form.submitCreate") : t("form.submitUpdate"),
    pending: t("form.pending"),
    success: creating ? t("form.created") : t("form.updated"),
    cancel: common("cancel"),
    close: common("close"),
    summary: common("fixFields"),
    fallbackError: errors("server"),
    errors: await errorCatalog(),
  };
}

export async function vacancyWorkflowLabels(): Promise<VacancyWorkflowLabels> {
  const t = await getTranslations("vacancies");
  const common = await getTranslations("common");
  const errors = await getTranslations("errors");

  const catalog = await errorCatalog();
  const shared = {
    cancel: common("cancel"),
    close: common("close"),
    summary: common("fixFields"),
    fallbackError: errors("server"),
    errors: catalog,
  };

  return {
    submit: {
      ...shared,
      trigger: t("submit.trigger"),
      title: t("submit.title"),
      description: t("submit.description"),
      submit: t("submit.confirm"),
      pending: t("submit.pending"),
      success: t("submit.success"),
    },
    archive: {
      ...shared,
      trigger: t("archive.trigger"),
      title: t("archive.title"),
      description: t("archive.description"),
      submit: t("archive.confirm"),
      pending: t("archive.pending"),
      success: t("archive.success"),
    },
    readinessTitle: t("approval.readyTitle"),
    readinessBlocked: t("approval.readyBlocked"),
    readyLine: t("approval.readyLine"),
    readiness: {
      met: t("approval.met"),
      unmet: t("approval.unmet"),
      requirements: Object.fromEntries(
        APPROVAL_REQUIREMENTS.map((requirement) => [
          requirement,
          t(`approval.requirements.${requirement}`),
        ]),
      ),
    },
  };
}

export async function vacancyDecisionLabels(): Promise<VacancyDecisionLabels> {
  const t = await getTranslations("vacancies");
  const common = await getTranslations("common");
  const errors = await getTranslations("errors");

  const catalog = await errorCatalog();
  const shared = {
    cancel: common("cancel"),
    close: common("close"),
    summary: common("fixFields"),
    fallbackError: errors("server"),
    errors: catalog,
  };

  return {
    approve: {
      ...shared,
      trigger: t("decide.approve.trigger"),
      title: t("decide.approve.title"),
      description: t("decide.approve.description"),
      submit: t("decide.approve.confirm"),
      pending: t("decide.approve.pending"),
      success: t("decide.approve.success"),
    },
    requestChanges: {
      ...shared,
      trigger: t("decide.requestChanges.trigger"),
      title: t("decide.requestChanges.title"),
      description: t("decide.requestChanges.description"),
      submit: t("decide.requestChanges.confirm"),
      pending: t("decide.requestChanges.pending"),
      success: t("decide.requestChanges.success"),
    },
    reject: {
      ...shared,
      trigger: t("decide.reject.trigger"),
      title: t("decide.reject.title"),
      description: t("decide.reject.description"),
      submit: t("decide.reject.confirm"),
      pending: t("decide.reject.pending"),
      success: t("decide.reject.success"),
    },
    note: t("decide.note"),
    noteHelp: t("decide.noteHelp"),
    noteRequiredHelp: t("decide.noteRequiredHelp"),
  };
}
