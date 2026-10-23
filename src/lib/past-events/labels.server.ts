import "server-only";

import { getTranslations } from "next-intl/server";

import type { ReviewDialogLabels } from "@/components/past-events/review-dialogs";
import type { DecisionLabels } from "@/components/register/inline-decision";
import { errorCatalog } from "@/lib/vacancies/labels.server";

const SHARED_ERRORS = [
  "server",
  "network",
  "timeout",
  "rateLimited",
  "unavailable",
  "forbidden",
  "validationFailed",
  "sessionExpired",
  "required",
  "tooLong",
  "userNotFound",
] as const;

export async function reviewDialogLabels(): Promise<ReviewDialogLabels> {
  const [t, common, errors] = await Promise.all([
    getTranslations("pastEventRequests"),
    getTranslations("common"),
    getTranslations("errors"),
  ]);
  return {
    approve: t("review.approve"),
    approveDescription: t("review.approveDescription"),
    approveRemovalDescription: t("review.approveRemovalDescription"),
    approveSuccess: t("review.approveSuccess"),
    reject: t("review.reject"),
    rejectDescription: t("review.rejectDescription"),
    rejectSuccess: t("review.rejectSuccess"),
    hours: t("review.hours"),
    xp: t("review.xp"),
    amountsHelp: t("review.amountsHelp"),
    reason: t("review.reason"),
    reasonHelp: t("review.reasonHelp"),
    close: common("close"),
    cancel: common("cancel"),
    pending: common("saving"),
    fallbackError: errors("server"),
    errors: {
      ...(await errorCatalog(SHARED_ERRORS)),
      hoursAmount: t("errors.hoursAmount"),
      xpAmount: t("errors.xpAmount"),
      pastEventRequestNotFound: t("errors.requestNotFound"),
      pastEventRequestNotPending: t("errors.notPending"),
      pastEventRequestIncomplete: t("errors.incomplete"),
      volunteerNotParticipant: t("errors.notParticipant"),
      pastEventGone: t("errors.eventGone"),
      pastEventUncreditedXp: t("errors.uncreditedXp"),
      pastEventVolunteerNotFound: t("errors.volunteerUnavailable"),
      pastEventRosterDuplicate: t("errors.rosterDuplicate"),
    },
  };
}

export async function eventDecisionLabels(): Promise<DecisionLabels> {
  const [t, decisions, errors] = await Promise.all([
    getTranslations("pastEventRequests"),
    getTranslations("decisions"),
    getTranslations("errors"),
  ]);
  return {
    group: t("event.decision"),
    cancel: decisions("cancel"),
    pending: decisions("pending"),
    fallbackError: errors("server"),
    errors: {
      ...(await errorCatalog(SHARED_ERRORS)),
      pastEventRosterNotFound: t("errors.rosterNotFound"),
      pastEventRosterDecided: t("errors.rosterDecided"),
      pastEventRequestIncomplete: t("errors.incomplete"),
      pastEventVolunteerNotFound: t("errors.eventVolunteerUnavailable"),
      pastEventRosterDuplicate: t("errors.eventRosterDuplicate"),
    },
  };
}
